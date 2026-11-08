package com.sillarvalley.ayni.address;

import com.sillarvalley.ayni.common.ApiException;
import com.sillarvalley.ayni.user.CurrentUser;
import com.sillarvalley.ayni.user.User;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AddressService {

    public static final int MAX_ADDRESSES = 5;

    private final CurrentUser currentUser;
    private final AddressRepository addresses;

    public AddressService(CurrentUser currentUser, AddressRepository addresses) {
        this.currentUser = currentUser;
        this.addresses = addresses;
    }

    @Transactional(readOnly = true)
    public List<AddressDtos.AddressResponse> list(Long uid) {
        return currentUser.require(uid).getAddresses().stream().map(AddressDtos.AddressResponse::of).toList();
    }

    @Transactional
    public AddressDtos.AddressResponse add(Long uid, AddressDtos.AddressRequest req) {
        User user = currentUser.require(uid);
        if (user.getAddresses().size() >= MAX_ADDRESSES) {
            throw ApiException.conflict("Puedes guardar hasta " + MAX_ADDRESSES + " direcciones");
        }
        Address address = req.toEntity();
        user.addAddress(address);
        return AddressDtos.AddressResponse.of(addresses.save(address));
    }

    @Transactional
    public AddressDtos.AddressResponse makePrimary(Long uid, Long addressId) {
        User user = currentUser.require(uid);
        Address target = find(user, addressId);
        user.getAddresses().forEach(a -> a.setPrimary(a == target));
        return AddressDtos.AddressResponse.of(target);
    }

    @Transactional
    public void delete(Long uid, Long addressId) {
        User user = currentUser.require(uid);
        Address target = find(user, addressId);
        if (user.getAddresses().size() == 1) {
            throw ApiException.conflict("Necesitas al menos una dirección");
        }
        user.getAddresses().remove(target);
        if (target.isPrimary()) {
            user.getAddresses().stream()
                    .min(Comparator.comparing(Address::getCreatedAt))
                    .ifPresent(a -> a.setPrimary(true));
        }
    }

    private static Address find(User user, Long addressId) {
        return user.getAddresses().stream()
                .filter(a -> a.getId().equals(addressId))
                .findFirst()
                .orElseThrow(() -> ApiException.notFound("Dirección no encontrada"));
    }
}
