package com.sillarvalley.ayni.address;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.sillarvalley.ayni.AppProperties;
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
        ReflectionTestUtils.setField(cayma, "latitude", -16.3716);
        ReflectionTestUtils.setField(cayma, "longitude", -71.5469);
        NeighborhoodRepository neighborhoods = mock(NeighborhoodRepository.class);
        when(neighborhoods.findByNameIgnoreCase(any())).thenReturn(Optional.empty());
        when(neighborhoods.findByNameIgnoreCase("Cayma")).thenReturn(Optional.of(cayma));
        AppProperties props = new AppProperties("x".repeat(32), 60, "http://localhost:3000", "JUNTA2026",
                "America/Lima", "51", "uploads", "http://localhost:3001", false,
                new AppProperties.City("Arequipa", -16.3988, -71.535));
        service = new AddressService(currentUser, repository, new Locations(neighborhoods, props));
    }

    private Address saved(String neighborhood, int minutesAgo) {
        Address a = new AddressDtos.AddressRequest(null, neighborhood, null, null, null).toEntity();
        ReflectionTestUtils.setField(a, "id", nextId++);
        ReflectionTestUtils.setField(a, "createdAt", Instant.now().minusSeconds(minutesAgo * 60L));
        user.addAddress(a);
        return a;
    }

    @Test
    void nuevaDireccionNoReemplazaALaPrincipal() {
        saved("Yanahuara", 10);

        var added = service.add(7L, new AddressDtos.AddressRequest("Trabajo", "Cayma", null, null, null));

        assertFalse(added.primary());
        assertEquals("Trabajo", added.label());
        assertEquals(2, user.getAddresses().size());
    }

    @Test
    void direccionSinGpsUsaElCentroDelBarrio() {
        saved("Yanahuara", 10);

        var added = service.add(7L, new AddressDtos.AddressRequest("Trabajo", "Cayma", null, null, null));

        assertEquals(-16.3716, added.latitude());
        assertEquals(-71.5469, added.longitude());
    }

    @Test
    void barrioDesconocidoSinGpsUsaElCentroDeLaCiudad() {
        saved("Yanahuara", 10);

        var added = service.add(7L, new AddressDtos.AddressRequest(null, "Pampa Nueva", null, null, null));

        assertEquals(-16.3988, added.latitude());
        assertEquals("Pampa Nueva", added.neighborhood());
    }

    @Test
    void elIconoSaleDelNombreDelLugar() {
        saved("Yanahuara", 10);

        var added = service.add(7L, new AddressDtos.AddressRequest("Casa de mi abuela", "Cayma", null, null, null));

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

        ApiException e = assertThrows(ApiException.class,
                () -> service.add(7L, new AddressDtos.AddressRequest(null, "Otro", null, null, null)));
        assertEquals(HttpStatus.CONFLICT, e.getStatus());
    }
}
