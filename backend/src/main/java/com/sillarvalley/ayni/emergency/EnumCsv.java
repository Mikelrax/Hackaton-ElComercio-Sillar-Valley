package com.sillarvalley.ayni.emergency;

import java.util.Arrays;
import java.util.Collection;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

final class EnumCsv {

    private EnumCsv() {}

    static <E extends Enum<E>> Set<E> parse(Class<E> type, String csv) {
        EnumSet<E> set = EnumSet.noneOf(type);
        if (csv == null || csv.isBlank()) {
            return set;
        }
        Arrays.stream(csv.split(","))
                .map(String::trim)
                .forEach(name -> Arrays.stream(type.getEnumConstants())
                        .filter(e -> e.name().equals(name))
                        .findFirst()
                        .ifPresent(set::add));
        return set;
    }

    static <E extends Enum<E>> String join(Collection<E> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        return values.stream().distinct().sorted().map(Enum::name).collect(Collectors.joining(","));
    }
}
