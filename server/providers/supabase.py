from PIL import Image
from io import BytesIO
from env import ENV

from supabase import acreate_client, AsyncClient
Supabase = AsyncClient # alias
supabase: Supabase | None = None

async def get_supabase() -> Supabase:
  global supabase

  if supabase is None:
    supabase = await acreate_client(ENV["SUPABASE_URL"], ENV["SUPABASE_KEY"])

  return supabase

async def save_image_to_supabase(image: Image.Image, filename: str, filetype: str, bucket_name: str, bucket_folder_name: str) -> str:
    global supabase

    buffer = BytesIO()
    format_type = filetype.split("/")[-1].upper()
    if format_type == "JPG":
        format_type = "JPEG"
        
    image.save(buffer, format=format_type)
    buffer.seek(0)

    res = await supabase.storage.from_(bucket_name).upload(
        file=buffer.getvalue(), 
        path=f"{bucket_folder_name}/{filename}", 
        file_options={"content-type": filetype},
    )

    buffer.close()

    return res.full_path
