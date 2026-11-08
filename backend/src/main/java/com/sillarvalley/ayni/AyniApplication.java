package com.sillarvalley.ayni;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class AyniApplication {

    public static void main(String[] args) {
        SpringApplication.run(AyniApplication.class, args);
    }
}
