# image-similarity

PoC implementation of the following functionality:

1. User takes photo of food

2. Photo is converted into an embedding or hash representing the contents of that photo

3. The embedding/hash is searched in a database against the user's other photos, pulling the most similar results

4. If the results are above some similarity threshold, we assume it's the same meal

5. If the results are above some lower threshold, we tell the user it looks like something they had but we're not sure; They can select yes.

All this is done sub-1s, with 2 benefits:

1. Provide faster UX compared to waiting 4+ seconds for a vision LLM

2. Identify food the user has previously uploaded and described, that a vision LLM would not be able to know contents of (eg protein shake)


## Running FastAPI server

Inside /server: 

Create & activate a conda environment and `pip install -r requirements.txt` (first time only)

`uvicorn --port 5000 main:app --reload --lifespan on`


## Database setup

I seeded a supabase project with ~500 images using [this script](server/_scripts/upload_images_to_storage.py)

The table to store embeddings, create an index, and create the lookup function is [here](server/_scripts/create_embedding_table.sql). It was executed directly in Supabase SQL Editor.

- You'll need to enable extension `pgvector` on your schema before running this.

Finally, [this script](server/_scripts/seed_embedding_table.py) embedded all the seed images and stored outputs in the table. 


## Web evaluation dashboard

## iOS app
