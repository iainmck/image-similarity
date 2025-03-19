from PIL import Image, ImageOps
from io import BytesIO
import base64
import re
from httpx import Timeout

from utils.httpx import httpx_client

def resize_image(image: Image.Image, size: int) -> Image.Image:
    # Make smallest dimension size
    # Preserve aspect ratio

    width, height = image.size
    if width < height:
        new_width = size
        new_height = int(height * (size / width))
    else:
        new_height = size
        new_width = int(width * (size / height))

    return image.resize((new_width, new_height), resample=Image.Resampling.LANCZOS)


# Convert Image (PIL) to Base64 
def img_2_b64(image: Image.Image) -> str:
    buff = BytesIO()
    image.save(buff, format="JPEG")
    img_str = base64.b64encode(buff.getvalue()).decode("utf-8")
    img_str = f"data:image/jpeg;base64,{img_str}" # Add prefix

    buff.close()
    return img_str

def b64_2_jpeg(b64: str) -> Image.Image:
    base64_string = re.sub('data:image\/.{1,10};base64,', '', b64)  # scrub any prefixes
    base64_string = base64.b64decode(base64_string)
    buff = BytesIO(base64_string)
    img = Image.open(buff)
    img = ImageOps.exif_transpose(img)  # Fix orientation
    copy = img.copy()  # Lets us close buffer

    buff.close()
    return copy

# Download image from web and return PIL Image
async def download_image(url: str) -> Image.Image:
    r = await httpx_client.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=Timeout(10))

    if r.status_code == 307:
        redirect_url = r.headers.get('location')
        if redirect_url is not None:
            r = await httpx_client.get(redirect_url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=Timeout(10))

    if r.status_code < 300:
        buff = BytesIO(r.content)
        img = Image.open(buff)
        img = ImageOps.exif_transpose(img)  # Fix orientation
        copy = img.copy()  # Lets us close buffer
        buff.close()
        return copy
    else:
        raise Exception("Could not open image file.")
