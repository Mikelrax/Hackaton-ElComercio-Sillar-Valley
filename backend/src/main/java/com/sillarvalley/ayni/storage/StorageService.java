package com.sillarvalley.ayni.storage;

import com.sillarvalley.ayni.AppProperties;
import com.sillarvalley.ayni.common.ApiException;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/** Guarda imágenes en disco (carpeta app.upload-dir). El nombre lo genera el servidor (UUID). */
@Service
public class StorageService {

    private static final Pattern VALID_NAME = Pattern.compile("^[0-9a-f]{32}\\.(jpg|png|webp)$");

    private final Path root;
    private final String publicBaseUrl;

    public StorageService(AppProperties props) {
        this.root = Path.of(props.uploadDir()).toAbsolutePath().normalize();
        String base = props.publicBaseUrl();
        this.publicBaseUrl = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }

    @PostConstruct
    void init() throws IOException {
        Files.createDirectories(root);
    }

    public Path root() {
        return root;
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("Debes enviar un archivo en el campo 'file'");
        }
        try {
            byte[] bytes = file.getBytes();
            // Se valida el contenido real (no solo la extensión ni el Content-Type que envía el cliente).
            String ext = detectExtension(bytes);
            if (ext == null) {
                throw ApiException.badRequest("Formato no permitido. Usa JPG, PNG o WEBP");
            }
            String name = UUID.randomUUID().toString().replace("-", "") + "." + ext;
            Files.write(root.resolve(name), bytes);
            return name;
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo guardar el archivo", e);
        }
    }

    public boolean exists(String fileName) {
        return fileName != null && VALID_NAME.matcher(fileName).matches()
                && Files.isRegularFile(root.resolve(fileName));
    }

    public String publicUrl(String fileName) {
        return publicBaseUrl + "/uploads/" + fileName;
    }

    static String detectExtension(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) {
            return "png";
        }
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return "webp";
        }
        return null;
    }
}
