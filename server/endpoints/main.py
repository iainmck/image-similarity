from fastapi import APIRouter
from pydantic import BaseModel
import asyncio
from uuid import uuid4

from env import ENV
from providers.supabase import get_supabase, save_image_to_supabase
from utils.image import b64_2_jpeg, resize_image

BUCKET_NAME = "embedded-images"
BUCKET_FOLDER_NAME = "uploads"
RESIZE_TO = 224

# Set embedding model and related table here
from providers.embed.cohere import embed_image, EmbedImageInput, EmbedImageOutput
EMBEDDING_TABLE = "embed_cohere_v1"
SEARCH_FUNCTION = f"search_{EMBEDDING_TABLE}"

# START OF ENDPOINT DEFINITIONS 
router = APIRouter()

class FindSimilarParams(BaseModel):
    image_base64: str

# Finds similar images to the input image using embeddings
@router.post('/find-similar')
async def find_similar(params: FindSimilarParams):
    results = await asyncio.gather(
        # Send for embedding
        embed_image(EmbedImageInput(image_base64=params.image_base64)),

        # Simultaneously save image to supabase
        save_image(params.image_base64),
    )

    embedding: EmbedImageOutput = results[0]
    image_url: str = results[1]

    supabase = await get_supabase()

    result = await supabase.rpc(SEARCH_FUNCTION, {
        "query_embedding": embedding.vector,
        "match_threshold": 0, # 1 to -1, where 1 is most similar and -1 is most dissimilar
        "match_count": 10,
        "user_id_filter": None,  # for prod
    }).execute()
    
    matches = [{ 
        "id": match["vector_record"]["id"],
        "filename": match["vector_record"]["filename"],
        "image_url": match["vector_record"]["image_url"],
        "similarity": 1.0 - match["distance"]
    } for match in result.data ]

    # Remove the input image from the matches, if it has been previously uploaded
    if len(matches) > 0 and matches[0]["similarity"] == 1.0:
        matches.pop(0)
    else:
        # Save embedding to supabase (move this to post-response background task in prod)
        await supabase.table(EMBEDDING_TABLE).insert({
            "filename": image_url.split("/")[-1],
            "image_url": image_url,
            "embedding": embedding.vector,
        }).execute()

    return { "matches": matches }


async def save_image(image_base64: str) -> str:
    image = b64_2_jpeg(image_base64)

    if min(image.size) < RESIZE_TO:
        image = resize_image(image, RESIZE_TO)

    full_path = await save_image_to_supabase(image, f"{uuid4()}.jpg", "image/jpeg", BUCKET_NAME, BUCKET_FOLDER_NAME)

    public_url = f"{ENV['SUPABASE_URL']}/storage/v1/object/public/{full_path}"

    return public_url
