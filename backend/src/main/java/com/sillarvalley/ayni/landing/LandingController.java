package com.sillarvalley.ayni.landing;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LandingController {

    private final LandingService service;

    public LandingController(LandingService service) {
        this.service = service;
    }

    @GetMapping("/api/landing")
    public LandingService.Landing landing() {
        return service.landing();
    }
}
