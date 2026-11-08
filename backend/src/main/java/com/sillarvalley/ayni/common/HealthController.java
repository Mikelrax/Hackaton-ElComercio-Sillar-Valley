package com.sillarvalley.ayni.common;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// OBSERVACIÓN: el controlador estaba bien, pero con Spring Security sin configurar
// devolvía 401. Ahora /api/health es público (ver SecurityConfig).
@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
                "application", "AYNI",
                "status", "OK"
        );
    }
}
