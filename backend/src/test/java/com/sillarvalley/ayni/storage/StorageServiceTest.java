package com.sillarvalley.ayni.storage;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

class StorageServiceTest {

    @Test
    void detectaJpg() {
        assertEquals("jpg", StorageService.detectExtension(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00}));
    }

    @Test
    void detectaPng() {
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0};
        assertEquals("png", StorageService.detectExtension(png));
    }

    @Test
    void detectaWebp() {
        byte[] webp = {'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P'};
        assertEquals("webp", StorageService.detectExtension(webp));
    }

    @Test
    void rechazaCualquierOtraCosa() {
        assertNull(StorageService.detectExtension("<?php echo 1; ?>".getBytes()));
        assertNull(StorageService.detectExtension(new byte[0]));
    }
}
