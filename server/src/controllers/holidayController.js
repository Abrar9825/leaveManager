// Official Government & Gazetted Public Holidays Catalog
const OFFICIAL_HOLIDAYS = {
  2026: [
    { date: '2026-01-01', name: "New Year's Day", type: 'Public Holiday' },
    { date: '2026-01-26', name: 'Republic Day', type: 'National Holiday' },
    { date: '2026-02-15', name: 'Maha Shivratri', type: 'Gazetted Holiday' },
    { date: '2026-03-04', name: 'Holi', type: 'Gazetted Holiday' },
    { date: '2026-03-20', name: 'Eid-ul-Fitr', type: 'Gazetted Holiday' },
    { date: '2026-03-31', name: 'Mahavir Jayanti', type: 'Gazetted Holiday' },
    { date: '2026-04-03', name: 'Good Friday', type: 'Gazetted Holiday' },
    { date: '2026-04-14', name: 'Dr. Ambedkar Jayanti', type: 'Public Holiday' },
    { date: '2026-05-01', name: 'Labour Day / May Day', type: 'Public Holiday' },
    { date: '2026-05-27', name: 'Bakrid / Eid-ul-Adha', type: 'Gazetted Holiday' },
    { date: '2026-06-26', name: 'Muharram', type: 'Gazetted Holiday' },
    { date: '2026-08-15', name: 'Independence Day', type: 'National Holiday' },
    { date: '2026-08-28', name: 'Raksha Bandhan', type: 'Public Holiday' },
    { date: '2026-09-04', name: 'Janmashtami', type: 'Gazetted Holiday' },
    { date: '2026-10-02', name: 'Mahatma Gandhi Jayanti', type: 'National Holiday' },
    { date: '2026-10-20', name: 'Dussehra / Vijayadashami', type: 'Gazetted Holiday' },
    { date: '2026-11-08', name: 'Diwali (Deepavali)', type: 'Gazetted Holiday' },
    { date: '2026-11-09', name: 'Govardhan Puja', type: 'Public Holiday' },
    { date: '2026-11-10', name: 'Bhai Dooj', type: 'Public Holiday' },
    { date: '2026-11-24', name: 'Guru Nanak Jayanti', type: 'Gazetted Holiday' },
    { date: '2026-12-25', name: 'Christmas Day', type: 'Gazetted Holiday' },
  ],
  2025: [
    { date: '2025-01-01', name: "New Year's Day", type: 'Public Holiday' },
    { date: '2025-01-26', name: 'Republic Day', type: 'National Holiday' },
    { date: '2025-02-26', name: 'Maha Shivratri', type: 'Gazetted Holiday' },
    { date: '2025-03-14', name: 'Holi', type: 'Gazetted Holiday' },
    { date: '2025-03-31', name: 'Eid-ul-Fitr', type: 'Gazetted Holiday' },
    { date: '2025-04-18', name: 'Good Friday', type: 'Gazetted Holiday' },
    { date: '2025-08-15', name: 'Independence Day', type: 'National Holiday' },
    { date: '2025-10-02', name: 'Mahatma Gandhi Jayanti', type: 'National Holiday' },
    { date: '2025-10-20', name: 'Diwali', type: 'Gazetted Holiday' },
    { date: '2025-12-25', name: 'Christmas Day', type: 'Gazetted Holiday' },
  ],
  2024: [
    { date: '2024-01-26', name: 'Republic Day', type: 'National Holiday' },
    { date: '2024-03-25', name: 'Holi', type: 'Gazetted Holiday' },
    { date: '2024-08-15', name: 'Independence Day', type: 'National Holiday' },
    { date: '2024-10-02', name: 'Mahatma Gandhi Jayanti', type: 'National Holiday' },
    { date: '2024-11-01', name: 'Diwali', type: 'Gazetted Holiday' },
    { date: '2024-12-25', name: 'Christmas Day', type: 'Gazetted Holiday' },
  ],
};

// GET /api/holidays?year=2026
export const getHolidays = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const holidays = OFFICIAL_HOLIDAYS[year] || OFFICIAL_HOLIDAYS[2026];

    res.json({
      success: true,
      year,
      count: holidays.length,
      data: holidays,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

