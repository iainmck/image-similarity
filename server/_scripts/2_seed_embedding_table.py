import asyncio
import sys, os
from tqdm import tqdm

# Before local imports, add parent dir to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from env import ENV
from utils.image import download_image, img_2_b64
from providers.supabase import get_supabase

# SELECT EMBEDDING PROVIDER HERE
from providers.embed.cohere import embed_image, PROVIDER_NAME, EmbedImageInput

BUCKET_NAME = "embedded-images"
BUCKET_FOLDER_NAME = "v1"
TABLE_NAME = f"embed_{PROVIDER_NAME}_v1"

num_errors = 0

async def main():
    global num_errors

    supabase = await get_supabase()

    # List all images in the dataset
    images = await supabase.storage.from_(BUCKET_NAME).list(BUCKET_FOLDER_NAME, options={"limit": 1000})
    image_urls = [f"{ENV['SUPABASE_URL']}/storage/v1/object/public/{BUCKET_NAME}/{BUCKET_FOLDER_NAME}/{image['name']}" for image in images]

    async def download_and_embed_image(image_url: str):
        global num_errors
        try:
            image = await download_image(image_url)

            # NOT resizing here since we resized images before uploading

            embedding = embed_image(EmbedImageInput(image_base64=img_2_b64(image)))
            image.close()

            # Insert into supabase
            # Note: You have to set this table up in supabase first, with the right dimensions for the embedding model
            await supabase.table(TABLE_NAME).insert({
                "filename": image_url.split("/")[-1],
                "image_url": image_url,
                "embedding": embedding.vector,
            }).execute()
        except Exception as e:
            if "duplicate key value" in str(e):
                print(f"Skipping previously embedded image {image_url}")
            else:
                print(f"Error embedding image {image_url}: {e}")
                num_errors += 1

    # Embed files in batches of at most 5 per second
    num_items = len(image_urls)
    batch_size = 5
    print(f"Embedding {num_items} images in batches of {batch_size}...")
    for i in tqdm(range(0, num_items, batch_size)):
        batch = image_urls[i:i+batch_size]
        await asyncio.gather(*(
            [download_and_embed_image(image_url) for image_url in batch] +
            [asyncio.sleep(1.0)]
        ))

        if num_errors > 10:
            print(f"Too many errors, stopping embedding.")
            break

    print("Embedding script complete.")

if __name__ == "__main__":
  asyncio.run(main())
