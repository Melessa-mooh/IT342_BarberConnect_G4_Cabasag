package edu.cit.cabasag.barberconnect.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public String uploadProfilePicture(String userId, MultipartFile file) throws IOException {
        try {
            // Options: create a specific folder structure for the images
            @SuppressWarnings("unchecked")
            Map<String, Object> options = (Map<String, Object>) ObjectUtils.asMap(
                    "folder", "barberconnect/profiles/" + userId,
                    "use_filename", true,
                    "unique_filename", true,
                    "overwrite", true
            );

            // Upload the file as bytes
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), options);

            // Secure url natively supports HTTPS rendering
            return uploadResult.get("secure_url").toString();

        } catch (Exception e) {
            log.error("Failed to upload image to Cloudinary", e);
            throw new RuntimeException("Cloudinary upload failed: " + e.getMessage());
        }
    }
}
