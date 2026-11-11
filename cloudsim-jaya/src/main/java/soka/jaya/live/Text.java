package soka.jaya.live;

import java.util.List;
import java.util.Locale;

/** Format angka dan label berbahasa Indonesia untuk log terminal dan website. */
public final class Text {
    public static final Locale ID = Locale.forLanguageTag("id-ID");

    private Text() {
    }

    public static String seconds(double value) {
        return String.format(ID, "%,.1f s", value);
    }

    public static String number(long value) {
        return String.format(ID, "%,d", value);
    }

    /** Durasi untuk manusia: "45 detik", "3 menit 05 detik". */
    public static String duration(double seconds) {
        long total = Math.round(Math.max(0, seconds));
        if (total < 60) {
            return total + " detik";
        }
        return String.format(ID, "%d menit %02d detik", total / 60, total % 60);
    }

    public static String algorithmName(String id) {
        return switch (id) {
            case "jaya" -> "JAYA";
            case "sa" -> "SA";
            case "sufferage" -> "Sufferage";
            case "rr" -> "Round Robin";
            default -> id;
        };
    }

    /** Contoh: "GoCJ 300 task · 20 VM · JAYA, SA · 3 seed". */
    public static String label(RunRequest request) {
        String dataset = request.dataset().equals("nasa") ? "NASA iPSC" : "GoCJ";
        List<String> names = request.algorithms().stream().map(Text::algorithmName).toList();
        boolean seeded = request.algorithms().stream().anyMatch(request::stochastic);
        return dataset + " " + number(request.tasks()) + " task · " + request.vms() + " VM · " + String.join(", ", names)
                + (seeded ? " · " + request.runs() + " seed" : "");
    }
}
