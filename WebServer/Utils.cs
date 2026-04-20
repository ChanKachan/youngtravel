using System;


public static class Utils
{
    public static string[] ParseStringToArray(string input)
    {
        if (string.IsNullOrEmpty(input))
            return Array.Empty<string>();

        // Разделяем по запятой и удаляем лишние пробелы
        return input.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => x.Trim())
                    .ToArray();
    }

    // Метод принимает строку в формате dd.MM.yyyy-dd.MM.yyyy
    // Возращает массив из 2-х элементов, каждый элемент имеет вид yyyy-MM-dd
    // Индексы:
    // 0 - дата начало
    // 1 - дата завершения
    public static DateTime[] ParseStringToDateTime(string input)
    {
        DateTime[] result = new DateTime[2];
        string[] period = input.Split('-');

        if (period.Length != 2)
        {
            throw new ArgumentException("Неверный формат даты");
        }

        result[0] = DateTime.ParseExact(period[0], "dd.MM.yyyy", null);
        result[1] = DateTime.ParseExact(period[1], "dd.MM.yyyy", null);

        return result;
    }

    // Метод принимает 2 даты
    // Возвращает строку в формате dd.MM.yyyy-dd.MM.yyyy
    public static string ParseDateTimeToString(DateTime startDate, DateTime endDate)
    {
        return $"{startDate:dd.MM.yyyy}-{endDate:dd.MM.yyyy}";
    }

    // Вспомогательный метод для валидации email
    public static bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
}
