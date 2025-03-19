from ..embed.index import EmbedImageInput, EmbedImageOutput

import cohere
from env import ENV
co = cohere.AsyncClientV2(api_key=ENV["COHERE_API_KEY"])

async def embed_image(input: EmbedImageInput) -> EmbedImageOutput:
    res = await co.embed(
        images=[input.image_base64],
        model="embed-english-light-v3.0",  # 384 dimensions
        embedding_types=["float"],
        input_type="image",
    )

    return EmbedImageOutput(vector=res.embeddings.float_[0])

PROVIDER_NAME = "cohere"
