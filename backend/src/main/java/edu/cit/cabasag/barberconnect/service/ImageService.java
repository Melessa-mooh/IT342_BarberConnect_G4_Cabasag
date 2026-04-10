package edu.cit.cabasag.barberconnect.service;

import com.google.cloud.storage.Bucket;
import com.google.firebase.cloud.StorageClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@Slf4j
public class ImageService {

    public String uploadProfilePicture(String userId, MultipartFile file) throws IOException {
        try {
            Bucket bucket = StorageClient.getInstance().bucket();
            
            // Create a unique filename
            String originalFileName = file.getOriginalFilename();
            String extension = originalFileName != null && originalFileName.contains(".") ? 
                    originalFileName.substring(originalFileName.lastIndexOf(".")) : "";
            String fileName = "profiles/" + userId + "/" + UUID.randomUUID() + extension;
            
            // Upload to Firebase Storage
            bucket.create(fileName, file.getBytes(), file.getContentType());
            
            // Return public URL (requires bucket to have public read access, or we format it as googleapis URL)
            return "https://firebasestorage.googleapis.com/v0/b/" + bucket.getName() + "/o/" + 
                    fileName.replace("/", "%2F") + "?alt=media";
                    
        } catch (Exception e) {
            log.error("Failed to upload image to Firebase Storage", e);
            throw new RuntimeException("Image upload failed: " + e.getMessage());
        }
    }
}
