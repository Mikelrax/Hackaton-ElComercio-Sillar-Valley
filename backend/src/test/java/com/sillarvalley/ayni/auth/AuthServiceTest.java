package com.sillarvalley.ayni.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sillarvalley.ayni.AppProperties;
import com.sillarvalley.ayni.address.AddressDtos;
import com.sillarvalley.ayni.catalog.Locations;
import com.sillarvalley.ayni.catalog.NeighborhoodRepository;
import com.sillarvalley.ayni.common.ApiException;
import com.sillarvalley.ayni.user.Role;
import com.sillarvalley.ayni.user.User;
import com.sillarvalley.ayni.user.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

class AuthServiceTest {

    private UserRepository users;
    private PasswordEncoder encoder;
    private JwtService jwt;
    private AuthService service;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        encoder = new BCryptPasswordEncoder(4);
        jwt = mock(JwtService.class);
        AppProperties props = new AppProperties("x".repeat(32), 60, "http://localhost:3000", "JUNTA2026",
                "America/Lima", "51", "uploads", "http://localhost:3001", false,
                new AppProperties.City("Arequipa", -16.3988, -71.535));
        service = new AuthService(users, encoder, jwt, props,
                new Locations(mock(NeighborhoodRepository.class), props));

        when(users.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            ReflectionTestUtils.setField(u, "id", 1L);
            return u;
        });
        when(jwt.issue(any(User.class))).thenReturn("token-falso");
    }

    private AuthDtos.RegisterRequest register(String phone, String invite) {
        var address = new AddressDtos.AddressRequest(null, " Yanahuara ", "Cerca al parque", -16.39, -71.54);
        return new AuthDtos.RegisterRequest("Ana Pérez", phone, "ANA@Mail.com", "clave12345", invite, address);
    }

    @Test
    void registroNormalCreaVecinoConTelefonoNormalizadoYEmailMinuscula() {
        var res = service.register(register("987 654 321", null));

        assertEquals(Role.NEIGHBOR, res.user().role());
        assertEquals("51987654321", res.user().phone());
        assertEquals("ana@mail.com", res.user().email());
        assertEquals("token-falso", res.token());
        assertEquals(3600, res.expiresInSeconds());
    }

    @Test
    void registroGuardaLaPrimeraDireccionComoPrincipal() {
        var res = service.register(register("987654321", null));

        var address = res.user().primaryAddress();
        assertEquals("Casa", address.label());
        assertEquals("Yanahuara", address.neighborhood());
        assertEquals("Cerca al parque", address.reference());
        assertTrue(address.primary());
    }

    @Test
    void registroDevuelveLaUbicacionDeLaDireccionPrincipal() {
        var location = service.register(register("987654321", null)).user().location();

        assertEquals(-16.39, location.latitude());
        assertEquals(-71.54, location.longitude());
        assertEquals("Yanahuara", location.neighborhood());
    }

    @Test
    void codigoDeInvitacionCorrectoCreaModerador() {
        var res = service.register(register("987654321", "JUNTA2026"));
        assertEquals(Role.MODERATOR, res.user().role());
    }

    @Test
    void codigoDeInvitacionIncorrectoEsBadRequest() {
        ApiException e = assertThrows(ApiException.class, () -> service.register(register("987654321", "MALO")));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
        verify(users, never()).save(any());
    }

    @Test
    void telefonoInvalidoEsBadRequest() {
        ApiException e = assertThrows(ApiException.class, () -> service.register(register("123", null)));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatus());
    }

    @Test
    void telefonoDuplicadoEsConflict() {
        when(users.existsByPhone("51987654321")).thenReturn(true);
        ApiException e = assertThrows(ApiException.class, () -> service.register(register("987654321", null)));
        assertEquals(HttpStatus.CONFLICT, e.getStatus());
    }

    @Test
    void loginCorrectoPorTelefono() {
        User u = new User();
        u.setFullName("Ana");
        u.setPhone("51987654321");
        u.setPasswordHash(encoder.encode("clave12345"));
        when(users.findByPhone("51987654321")).thenReturn(Optional.of(u));

        var res = service.login(new AuthDtos.LoginRequest("+51 987654321", "clave12345"));
        assertEquals("token-falso", res.token());
    }

    @Test
    void loginCorrectoPorEmail() {
        User u = new User();
        u.setFullName("Ana");
        u.setPhone("51987654321");
        u.setEmail("ana@mail.com");
        u.setPasswordHash(encoder.encode("clave12345"));
        when(users.findByEmail("ana@mail.com")).thenReturn(Optional.of(u));

        var res = service.login(new AuthDtos.LoginRequest("Ana@Mail.com", "clave12345"));
        assertEquals("Bearer", res.tokenType());
    }

    @Test
    void passwordIncorrectaEsUnauthorized() {
        User u = new User();
        u.setPasswordHash(encoder.encode("clave12345"));
        when(users.findByPhone("51987654321")).thenReturn(Optional.of(u));

        ApiException e = assertThrows(ApiException.class,
                () -> service.login(new AuthDtos.LoginRequest("987654321", "otra-clave")));
        assertEquals(HttpStatus.UNAUTHORIZED, e.getStatus());
    }

    @Test
    void usuarioInexistenteEsUnauthorized() {
        when(users.findByPhone("51999999999")).thenReturn(Optional.empty());
        ApiException e = assertThrows(ApiException.class,
                () -> service.login(new AuthDtos.LoginRequest("999999999", "x")));
        assertEquals(HttpStatus.UNAUTHORIZED, e.getStatus());
    }

    @Test
    void cuentaDesactivadaEsForbidden() {
        User u = new User();
        u.setPasswordHash(encoder.encode("clave12345"));
        u.setActive(false);
        when(users.findByPhone("51987654321")).thenReturn(Optional.of(u));

        ApiException e = assertThrows(ApiException.class,
                () -> service.login(new AuthDtos.LoginRequest("987654321", "clave12345")));
        assertEquals(HttpStatus.FORBIDDEN, e.getStatus());
    }
}
