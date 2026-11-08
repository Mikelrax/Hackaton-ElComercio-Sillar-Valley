package com.sillarvalley.ayni;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

// OBSERVACIÓN: el paquete se renombró de "Ayni" a "ayni" (minúsculas).
// Java exige/recomienda paquetes en minúsculas; con mayúsculas funciona en Windows
// pero puede romper en Linux/CI o con ciertas herramientas.
@SpringBootApplication
@ConfigurationPropertiesScan
public class AyniApplication {

    public static void main(String[] args) {
        SpringApplication.run(AyniApplication.class, args);
    }
}
