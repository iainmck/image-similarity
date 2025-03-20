import asyncio
import sys, os
import mimetypes
import dataclasses
from tqdm import tqdm
from PIL import Image, ImageOps

# Before local imports, add parent dir to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from utils.image import resize_image
from providers.supabase import save_image_to_supabase

BUCKET_NAME = "embedded-images"
BUCKET_FOLDER_NAME = "v1"
ACCEPTED_FORMATS = ["jpg", "jpeg", "png"]
RESIZE_TO = 224 # Resize images to 224px on smallest dimension (believe this is what embedding models are typically trained on)

num_errors = 0

@dataclasses.dataclass
class QueueItem:
    filepath: str
    filetype: str

async def upload_file(filepath: str, filetype: str):
    global num_errors
    try:
        filename = os.path.basename(filepath)
        
        with Image.open(filepath) as image:
            image = ImageOps.exif_transpose(image)  # Fix orientation
            image = resize_image(image, RESIZE_TO)
            
            await save_image_to_supabase(image, filename, filetype, BUCKET_NAME, BUCKET_FOLDER_NAME)
    except Exception as e:
        # Check for duplicate file error (409 Conflict)
        if "duplicate" in str(e).lower() and "409" in str(e):
            print(f"Skipping duplicate file {filepath} - already exists in storage")
        else:
            print(f"Error uploading file {filepath}: {e}")
            num_errors += 1

async def main():
    global num_errors

    images_dir = "../images"
    
    # Get all files in the images directory and create upload queue
    upload_queue: list[QueueItem] = []
    for filename in os.listdir(images_dir):
        filepath = os.path.join(images_dir, filename)
        
        # Skip if not a file
        if not os.path.isfile(filepath):
            continue
            
        filetype = mimetypes.guess_type(filepath)[0]
        if not filetype:
            extension = filename.split(".")[-1].lower()
            if extension in ACCEPTED_FORMATS:
                filetype = f"image/{extension}"
            else:
                print(f"Skipping file with unsupported filetype: {filepath}")
                continue
        
        upload_queue.append(QueueItem(filepath, filetype))

    # Upload files in batches of 10
    batch_size = 10
    for i in tqdm(range(0, len(upload_queue), batch_size)):
        batch = upload_queue[i:i+batch_size]
        await asyncio.gather(*[upload_file(item.filepath, item.filetype) for item in batch])

        if num_errors > 10:
            print(f"Too many errors, stopping upload.")
            break

    print("Upload script complete.")

if __name__ == "__main__":
  asyncio.run(main())
