package com.sillarvalley.ayni;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

// OBSERVACIÓN: este test levanta el contexto completo, así que necesita PostgreSQL
// corriendo con la base "ayni" creada (ver db/00_crear_base.sql). Si no, falla.
@SpringBootTest
class AyniApplicationTests {

    @Test
    void contextLoads() {
    }
}
