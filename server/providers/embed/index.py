from pydantic import BaseModel

# ALL PROVIDERS SHOULD DEFINE A embed_image() FUNCTION WITH THIS INPUT & OUTPUT

class EmbedImageInput(BaseModel):
    image_base64: str

class EmbedImageOutput(BaseModel):
    vector: tuple[float, ...]

    def __hash__(self):
        return hash(self.vector)

# AS WELL AS DEFINE THESE VARIABLES:
# - PROVIDER_NAME
