package com.sillarvalley.ayni.address;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.sillarvalley.ayni.TestProps;
import com.sillarvalley.ayni.catalog.Locations;
import com.sillarvalley.ayni.catalog.Neighborhood;
import com.sillarvalley.ayni.catalog.NeighborhoodRepository;
import com.sillarvalley.ayni.common.ApiException;
import com.sillarvalley.ayni.user.CurrentUser;
import com.sillarvalley.ayni.user.User;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

class AddressServiceTest {

    private User user;
    private AddressService service;
    private long nextId = 1;

    @BeforeEach
    void setUp() {
        user = new User();
        CurrentUser currentUser = mock(CurrentUser.class);
        when(currentUser.require(7L)).thenReturn(user);
        AddressRepository repository = mock(AddressRepository.class);
        when(repository.save(any(Address.class))).thenAnswer(inv -> inv.getArgument(0));
        Neighborhood cayma = new Neighborhood();
        ReflectionTestUtils.setField(cayma, "name", "Cayma");
        NeighborhoodRepository neighborhoods = mock(NeighborhoodRepository.class);
        when(neighborhoods.findNearest(anyDouble(), anyDouble())).thenReturn(Optional.of(cayma));
        when(neighborhoods.findNearest(-15.0, -70.0)).thenReturn(Optional.empty());
        service = new AddressService(currentUser, repository, new Locations(neighborhoods, TestProps.create()));
    }

    private Address saved(String neighborhood, int minutesAgo) {
        Address a = new AddressDtos.AddressRequest(null, null, -16.39, -71.54).toEntity();
        a.setNeighborhood(neighborhood);
        ReflectionTestUtils.setField(a, "id", nextId++);
        ReflectionTestUtils.setField(a, "createdAt", Instant.now().minusSeconds(minutesAgo * 60L));
        user.addAddress(a);
        return a;
    }

    private static AddressDtos.AddressRequest at(String label, double latitude, double longitude) {
        return new AddressDtos.AddressRequest(label, null, latitude, longitude);
    }

    @Test
    void nuevaDireccionNoReemplazaALaPrincipal() {
        saved("Yanahuara", 10);

        var added = service.add(7L, at("Trabajo", -16.3716, -71.5469));

        assertFalse(added.primary());
        assertEquals("Trabajo", added.label());
        assertEquals(2, user.getAddresses().size());
    }

    @Test
    void elBarrioSeDetectaDesdeElPunto() {
        saved("Yanahuara", 10);

        var added = service.add(7L, at("Trabajo", -16.3716, -71.5469));

        assertEquals("Cayma", added.neighborhood());
        assertEquals(-16.3716, added.latitude());
        assertEquals(-71.5469, added.longitude());
    }

    @Test
    void puntoSinBarrioCercanoUsaElNombreDeLaCiudad() {
        saved("Yanahuara", 10);

        var added = service.add(7L, at(null, -15.0, -70.0));

        assertEquals("Arequipa", added.neighborhood());
    }

    @Test
    void elIconoSaleDelNombreDelLugar() {
        saved("Yanahuara", 10);

        var added = service.add(7L, at("Casa de mi abuela", -16.3716, -71.5469));

        assertEquals(AddressPlace.FAMILY.icon(), added.icon());
    }

    @Test
    void cambiarPrincipalDejaSoloUna() {
        Address casa = saved("Yanahuara", 10);
        Address trabajo = saved("Cayma", 5);

        service.makePrimary(7L, trabajo.getId());

        assertTrue(trabajo.isPrimary());
        assertFalse(casa.isPrimary());
    }

    @Test
    void borrarLaPrincipalPromueveLaMasAntigua() {
        Address casa = saved("Yanahuara", 30);
        Address mama = saved("Cercado", 20);
        saved("Cayma", 10);

        service.delete(7L, casa.getId());

        assertTrue(mama.isPrimary());
        assertEquals(2, user.getAddresses().size());
    }

    @Test
    void noSePuedeBorrarLaUnicaDireccion() {
        Address casa = saved("Yanahuara", 10);

        ApiException e = assertThrows(ApiException.class, () -> service.delete(7L, casa.getId()));
        assertEquals(HttpStatus.CONFLICT, e.getStatus());
    }

    @Test
    void maximoCincoDirecciones() {
        for (int i = 0; i < AddressService.MAX_ADDRESSES; i++) {
            saved("Barrio " + i, i);
        }

        ApiException e = assertThrows(ApiException.class, () -> service.add(7L, at(null, -16.39, -71.54)));
        assertEquals(HttpStatus.CONFLICT, e.getStatus());
    }
}
