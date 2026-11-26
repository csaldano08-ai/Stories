from huggingface_hub import snapshot_download, list_repo_files
print(list_repo_files("ResembleAI/chatterbox"))
p=snapshot_download("ResembleAI/chatterbox-turbo", allow_patterns=["*.safetensors","*.json","*.txt","*.pt","*.model"]); print("turbo",p)
p=snapshot_download("ResembleAI/chatterbox", allow_patterns=["ve.pt","t3_mtl23ls_v3.safetensors","s3gen.pt","grapheme_mtl_merged_expanded_v1.json","conds.pt","Cangjie5_TC.json"]); print("mtl",p)
