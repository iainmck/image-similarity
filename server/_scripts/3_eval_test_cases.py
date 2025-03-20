import asyncio
import sys, os
from tqdm import tqdm

# Before local imports, add parent dir to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from providers.supabase import get_supabase

# SELECT EMBEDDING PROVIDER HERE
from providers.embed.cohere import PROVIDER_NAME

MODEL_NAME = f"{PROVIDER_NAME}_v1"
TABLE_NAME = f"embed_{MODEL_NAME}"
SEARCH_FUNCTION = f"search_{TABLE_NAME}"

num_errors = 0

async def main():
    global num_errors

    supabase = await get_supabase()

    # Retrieve all test cases from supabase
    test_cases = await supabase.table("evals_expected").select("*").execute()
    test_cases = test_cases.data

    async def do_similarity_search(test_case: dict):
        global num_errors
        try:
            # Get vector for test case
            embedding = await supabase.table(TABLE_NAME).select("embedding, filename, image_url").eq("filename", test_case["filename"]).single().execute()
            vector = embedding.data["embedding"]

            matches = await supabase.rpc(SEARCH_FUNCTION, {
                "query_embedding": vector,
                "match_threshold": 0, # 1 to -1, where 1 is most similar and -1 is most dissimilar
                "match_count": 25,
                "user_id_filter": None,
            }).execute()

            matches = [{ 
                "id": match["vector_record"]["id"],
                "filename": match["vector_record"]["filename"],
                "image_url": match["vector_record"]["image_url"],
                "similarity": 1.0 - match["distance"]
            } for match in matches.data if match["distance"] > 0.0 ] # Dont include self (0 distance)

            # Save results to supabase
            await supabase.table("evals_actual").insert({
                "expected_id": test_case["id"],
                "model": MODEL_NAME,
                "image_url": embedding.data["image_url"],
                "filename": test_case["filename"],
                "matches": matches,
            }).execute()
        except Exception as e:
            print(f"Error doing similarity search for test case {test_case['id']}: {e}")
            num_errors += 1

    # Execute all test cases in batches of 10
    num_items = len(test_cases)
    batch_size = 10
    print(f"Executing {num_items} test cases in batches of {batch_size}...")
    for i in tqdm(range(0, num_items, batch_size)):
        batch = test_cases[i:i+batch_size]
        await asyncio.gather(*[do_similarity_search(test_case) for test_case in batch])

        if num_errors > 10:
            print(f"Too many errors, stopping execution.")
            break

    print("Execution complete.")

if __name__ == "__main__":
  asyncio.run(main())
