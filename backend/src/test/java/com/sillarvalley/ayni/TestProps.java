package com.sillarvalley.ayni;

public final class TestProps {

    private TestProps() {}

    public static AppProperties create() {
        return new AppProperties("x".repeat(32), 60, "http://localhost:3000", "JUNTA2026",
                "America/Lima", "51", "uploads", "http://localhost:3001", false,
                new AppProperties.City("Arequipa", -16.3988, -71.535),
                new AppProperties.Geo("https://tiles.example/style.json", "http://localhost:9"));
    }
}
