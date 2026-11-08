package com.sillarvalley.ayni.auth;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService service;
    private final DemoAccessService demo;

    public AuthController(AuthService service, DemoAccessService demo) {
        this.service = service;
        this.demo = demo;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthDtos.AuthResponse register(@Valid @RequestBody AuthDtos.RegisterRequest req) {
        return service.register(req);
    }

    @PostMapping("/login")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest req) {
        return service.login(req);
    }

    @GetMapping("/demo")
    public List<AuthDtos.DemoAccount> demoAccounts() {
        return demo.accounts();
    }

    @PostMapping("/demo/{key}")
    public AuthDtos.AuthResponse demoLogin(@PathVariable String key) {
        return demo.login(key);
    }
}
