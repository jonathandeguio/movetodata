package io.movetodata.snap.sharedutils;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.BeanWrapperImpl;

import java.beans.FeatureDescriptor;
import java.beans.PropertyDescriptor;
import java.util.Arrays;
import java.util.Objects;

public interface MoveToDataUtils {
    private static String[] getNullPropertyNames(Object source) {
        final BeanWrapper src = new BeanWrapperImpl(source);
        PropertyDescriptor[] pds = src.getPropertyDescriptors();

        return Arrays.stream(pds).parallel().map(FeatureDescriptor::getName).filter(name -> Objects.isNull(src.getPropertyValue(name))).toArray(String[]::new);
    }

    /**
     * Copies the non-null values of the passed object which are exposed by the bean
     * @param source copies the values of this object
     */
    default void copyNonNullProperties(Object source) {
        BeanUtils.copyProperties( source, this, getNullPropertyNames(source));
    }
}
