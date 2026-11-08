package com.sillarvalley.ayni.address;

import com.sillarvalley.ayni.user.CurrentUser;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me/addresses")
public class AddressController {

    private final AddressService service;

    public AddressController(AddressService service) {
        this.service = service;
    }

    @GetMapping
    public List<AddressDtos.AddressResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return service.list(CurrentUser.idOf(jwt));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AddressDtos.AddressResponse add(@AuthenticationPrincipal Jwt jwt,
                                           @Valid @RequestBody AddressDtos.AddressRequest req) {
        return service.add(CurrentUser.idOf(jwt), req);
    }

    @PostMapping("/{id}/primary")
    public AddressDtos.AddressResponse makePrimary(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.makePrimary(CurrentUser.idOf(jwt), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        service.delete(CurrentUser.idOf(jwt), id);
    }
}
