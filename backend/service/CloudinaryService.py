import cloudinary
import cloudinary.uploader
import requests

from config.Cloudinary import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)

class CloudinaryService:

    @staticmethod
    def upload_contract(file, filename: str):
        result = cloudinary.uploader.upload(
            file,
            resource_type="raw",
            folder="contracts",

            filename_override=filename,
            use_filename=True,
            unique_filename=True,
            overwrite=False
        )

        return {
            "public_id": result["public_id"],
            "url": result["secure_url"],
            "version": result["version"]
        }


    @staticmethod
    def download_contract(url: str) -> bytes:
        response = requests.get(url)

        response.raise_for_status()

        return response.content