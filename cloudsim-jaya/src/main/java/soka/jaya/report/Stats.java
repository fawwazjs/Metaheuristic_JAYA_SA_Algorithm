package soka.jaya.report;

import java.util.List;

/** Ringkasan beberapa run: rata-rata, simpangan baku sampel (n−1), minimum, maksimum. */
public record Stats(double mean, double std, double min, double max) {

    public static Stats of(List<Double> values) {
        double sum = 0;
        double min = Double.POSITIVE_INFINITY;
        double max = Double.NEGATIVE_INFINITY;
        for (double value : values) {
            sum += value;
            min = Math.min(min, value);
            max = Math.max(max, value);
        }
        double mean = sum / values.size();
        double squares = 0;
        for (double value : values) {
            squares += (value - mean) * (value - mean);
        }
        double std = values.size() > 1 ? Math.sqrt(squares / (values.size() - 1)) : 0;
        return new Stats(mean, std, min, max);
    }
}
