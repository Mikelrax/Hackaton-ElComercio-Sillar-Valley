package com.sillarvalley.ayni.common;

import java.time.Instant;
import java.util.Map;

/** Formato único de error para toda la API. */
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fieldErrors
) {}
