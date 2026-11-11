package soka.jaya.report;

import java.lang.reflect.RecordComponent;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collection;
import java.util.Map;

/**
 * Penulis JSON kecil untuk ekspor ke website. Mendukung Map, Collection, record
 * (nama komponen menjadi key), array int/double, teks, angka, dan boolean.
 * Angka desimal dibulatkan ke 3 digit.
 */
public final class Json {
    private Json() {
    }

    public static String write(Object value) {
        StringBuilder out = new StringBuilder();
        append(out, value);
        return out.toString();
    }

    private static void append(StringBuilder out, Object value) {
        if (value == null) {
            out.append("null");
        } else if (value instanceof String text) {
            appendString(out, text);
        } else if (value instanceof Boolean || value instanceof Integer || value instanceof Long) {
            out.append(value);
        } else if (value instanceof Number number) {
            appendDouble(out, number.doubleValue());
        } else if (value instanceof Map<?, ?> map) {
            out.append('{');
            boolean first = true;
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                if (!first) {
                    out.append(',');
                }
                first = false;
                appendString(out, String.valueOf(entry.getKey()));
                out.append(':');
                append(out, entry.getValue());
            }
            out.append('}');
        } else if (value instanceof Collection<?> items) {
            out.append('[');
            boolean first = true;
            for (Object item : items) {
                if (!first) {
                    out.append(',');
                }
                first = false;
                append(out, item);
            }
            out.append(']');
        } else if (value instanceof double[] numbers) {
            out.append('[');
            for (int i = 0; i < numbers.length; i++) {
                if (i > 0) {
                    out.append(',');
                }
                appendDouble(out, numbers[i]);
            }
            out.append(']');
        } else if (value instanceof int[] numbers) {
            out.append('[');
            for (int i = 0; i < numbers.length; i++) {
                if (i > 0) {
                    out.append(',');
                }
                out.append(numbers[i]);
            }
            out.append(']');
        } else if (value instanceof Record record) {
            appendRecord(out, record);
        } else {
            throw new IllegalArgumentException("Tipe tidak didukung: " + value.getClass());
        }
    }

    private static void appendRecord(StringBuilder out, Record record) {
        out.append('{');
        RecordComponent[] components = record.getClass().getRecordComponents();
        for (int i = 0; i < components.length; i++) {
            if (i > 0) {
                out.append(',');
            }
            appendString(out, components[i].getName());
            out.append(':');
            try {
                var accessor = components[i].getAccessor();
                accessor.setAccessible(true);
                append(out, accessor.invoke(record));
            } catch (ReflectiveOperationException e) {
                throw new IllegalStateException("Gagal membaca " + components[i].getName(), e);
            }
        }
        out.append('}');
    }

    private static void appendDouble(StringBuilder out, double number) {
        if (!Double.isFinite(number)) {
            out.append("null");
            return;
        }
        out.append(BigDecimal.valueOf(number).setScale(3, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString());
    }

    private static void appendString(StringBuilder out, String text) {
        out.append('"');
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                default -> {
                    if (c < 0x20) {
                        out.append(String.format("\\u%04x", (int) c));
                    } else {
                        out.append(c);
                    }
                }
            }
        }
        out.append('"');
    }
}
