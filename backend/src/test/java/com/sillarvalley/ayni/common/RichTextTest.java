package com.sillarvalley.ayni.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class RichTextTest {

    @Test
    void keepsAllowedFormatting() {
        String html = "<p>Hola <strong>vecinos</strong> y <em>vecinas</em></p><ul><li>Agua</li><li>Pan</li></ul>";
        assertEquals(html, RichText.clean(html));
    }

    @Test
    void stripsScriptsAttributesAndUnknownTags() {
        String cleaned = RichText.clean("<p onclick=\"x()\">Hola<script>alert(1)</script><a href=\"http://x\">link</a></p>");
        assertFalse(cleaned.contains("script"));
        assertFalse(cleaned.contains("onclick"));
        assertFalse(cleaned.contains("<a"));
        assertTrue(cleaned.contains("Hola"));
        assertTrue(cleaned.contains("link"));
    }

    @Test
    void leavesPlainTextUntouched() {
        assertEquals("Necesito una escalera <2 horas>", RichText.clean("  Necesito una escalera <2 horas>  "));
    }

    @Test
    void emptyRichTextBecomesEmpty() {
        assertEquals("", RichText.clean("<p><br></p>"));
        assertEquals("", RichText.clean("   "));
    }

    @Test
    void plainKeepsLineBreaksAndDecodesSpaces() {
        assertEquals("Hola vecinos\nAgua\nPan", RichText.plain("<p>Hola&nbsp;vecinos</p><ul><li>Agua</li><li>Pan</li></ul>"));
    }

    @Test
    void plainOfNullIsEmpty() {
        assertEquals("", RichText.plain(null));
        assertEquals(null, RichText.clean(null));
    }
}
