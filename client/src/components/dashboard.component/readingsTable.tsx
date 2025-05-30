import { useState } from 'react';
import { Table, type Column } from '../global/Table';

type FeederReading = {
  feederName: string;
  yesterdayEnergyConsumption: number;
  todayNominalEnergyConsumption: number;
  todayActualEnergyConsumption?: number;
};

const feederReadings: FeederReading[] = [
    {
        feederName: 'DUGBE AWOLOWO 11KV FEEDER',
        yesterdayEnergyConsumption: 1250,
        todayNominalEnergyConsumption: 1300,
    },
    {
        feederName: 'YEMETU 11KV FEEDER',
        yesterdayEnergyConsumption: 900,
        todayNominalEnergyConsumption: 950,
    },
    {
        feederName: 'EKOTEDO 11KV FEEDER',
        yesterdayEnergyConsumption: 870,
        todayNominalEnergyConsumption: 900,
    },
    {
        feederName: 'DUGBE INDUSTRIAL 11KV FEEDER',
        yesterdayEnergyConsumption: 1450,
        todayNominalEnergyConsumption: 1500,
    },
    {
        feederName: 'RAILWAY 11KV FEEDER',
        yesterdayEnergyConsumption: 820,
        todayNominalEnergyConsumption: 860,
    },
    {
        feederName: 'IWO ROAD 11KV FEEDER',
        yesterdayEnergyConsumption: 1000,
        todayNominalEnergyConsumption: 1050,
    },
    {
        feederName: 'SECRETARIAT 11KV FEEDER',
        yesterdayEnergyConsumption: 890,
        todayNominalEnergyConsumption: 940,
    },
    {
        feederName: 'STATE HOUSE 11KV FEEDER',
        yesterdayEnergyConsumption: 1100,
        todayNominalEnergyConsumption: 1150,
    },
    {
        feederName: 'BASORUN 11KV FEEDER',
        yesterdayEnergyConsumption: 980,
        todayNominalEnergyConsumption: 1020,
    },
    {
        feederName: 'OKE-BOLA 11KV FEEDER',
        yesterdayEnergyConsumption: 920,
        todayNominalEnergyConsumption: 970,
    },
    {
        feederName: 'DUGBE BANK ROAD 11KV FEEDER',
        yesterdayEnergyConsumption: 1020,
        todayNominalEnergyConsumption: 1080,
    },
    {
        feederName: 'DUGBE SANGO 11KV FEEDER',
        yesterdayEnergyConsumption: 880,
        todayNominalEnergyConsumption: 930,
    },
    {
        feederName: 'OREMEJI 11KV FEEDER',
        yesterdayEnergyConsumption: 970,
        todayNominalEnergyConsumption: 1020,
    },
    {
        feederName: 'OJE 11KV FEEDER',
        yesterdayEnergyConsumption: 950,
        todayNominalEnergyConsumption: 990,
    },
    {
        feederName: 'IJOKODO 11KV FEEDER',
        yesterdayEnergyConsumption: 1010,
        todayNominalEnergyConsumption: 1060,
    },
    {
        feederName: 'COCOA HOUSE 11KV FEEDER',
        yesterdayEnergyConsumption: 1230,
        todayNominalEnergyConsumption: 1300,
    },
    {
        feederName: 'OLOGUNERU 11KV FEEDER',
        yesterdayEnergyConsumption: 980,
        todayNominalEnergyConsumption: 1030,
    },
    {
        feederName: 'TOP SUCCESS 11KV FEEDER',
        yesterdayEnergyConsumption: 860,
        todayNominalEnergyConsumption: 900,
    },
];

export default function ReadingsTable() {
  const [readings, setReadings] = useState<FeederReading[]>(feederReadings);

  const handleInputChange = (index: number, value: string) => {
    const updated = [...readings];
    updated[index].todayActualEnergyConsumption = Number(value);
    setReadings(updated);
  };

  const columns: Column<FeederReading>[] = [
    {
      header: "Feeder",
      accessor: 'feederName',
    },
    {
      header: "Yesterday's Energy Consumption",
      accessor: 'yesterdayEnergyConsumption',
    },
    {
      header: "Today's Nominal Energy Consumption",
      accessor: 'todayNominalEnergyConsumption',
    },
    {
      header: "Today's Actual Energy Consumption",
      accessor: 'todayActualEnergyConsumption',
      cell: (row, rowIndex) => (
        <input
          type="number"
          className="no-spinner border rounded px-2 py-1 w-full"
          value={row.todayActualEnergyConsumption ?? ''}
          onChange={(e) => handleInputChange(rowIndex, e.target.value)}
        />
      ),
    },
  ];

  return (
    <div className="p-4">
      <Table columns={columns} data={readings} />
    </div>
  );
}
