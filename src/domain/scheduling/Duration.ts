const MINUTES_PER_HOUR = 60;

/**
 * Duração em minutos inteiros. Objeto de valor imutável.
 *
 * Toda contagem de horas do sistema usa minutos inteiros para evitar erros de
 * ponto flutuante: 42h = 2520 min, 8h24 = 504 min.
 */
export class Duration {
  private constructor(public readonly minutes: number) {}

  static fromMinutes(minutes: number): Duration {
    if (!Number.isInteger(minutes)) {
      throw new RangeError(`Duração deve ser em minutos inteiros, recebido ${minutes}`);
    }
    if (minutes < 0) {
      throw new RangeError(`Duração não pode ser negativa, recebido ${minutes}`);
    }
    return new Duration(minutes);
  }

  static fromHoursMinutes(hours: number, minutes: number): Duration {
    if (!Number.isInteger(hours) || hours < 0) {
      throw new RangeError(`Horas devem ser inteiro não negativo, recebido ${hours}`);
    }
    if (!Number.isInteger(minutes) || minutes < 0 || minutes >= MINUTES_PER_HOUR) {
      throw new RangeError(`Minutos devem estar entre 0 e 59, recebido ${minutes}`);
    }
    return new Duration(hours * MINUTES_PER_HOUR + minutes);
  }

  static sum(durations: readonly Duration[]): Duration {
    return durations.reduce((total, current) => total.plus(current), new Duration(0));
  }

  plus(other: Duration): Duration {
    return new Duration(this.minutes + other.minutes);
  }

  minus(other: Duration): Duration {
    return Duration.fromMinutes(this.minutes - other.minutes);
  }

  equals(other: Duration): boolean {
    return this.minutes === other.minutes;
  }

  toString(): string {
    const hours = Math.floor(this.minutes / MINUTES_PER_HOUR);
    const remainder = this.minutes % MINUTES_PER_HOUR;
    return `${hours}h${String(remainder).padStart(2, '0')}`;
  }
}
