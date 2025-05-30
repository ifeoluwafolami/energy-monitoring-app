import ReadingsTable from "./readingsTable";

export default function UserDashboard() {

    type TopDisplayType = {
        [key: string]: string | number; 
    };

    const topDisplay: TopDisplayType = {
        "Date": "11th April 2025",
        "Region": "IBADAN",
        "Business Hub": "DUGBE"
    }

    return (
        <div className="font-audiowide text-primary-blue flex flex-col justify-center items-center">
            <div className="w-full mt-2">

                <h1 className="text-xl">Welcome, <span className="text-primary-orange text-3xl">Hephzibah.</span></h1>

            </div>

            <div className="bg-white my-6 py-10 px-6 w-[80%] h-[150vh] rounded-[50px] flex flex-col gap-2">

                <div className="flex justify-between mx-10">
                    {
                        Object.keys(topDisplay).map((key) => {
                            return (
                                <h3 className="text-lg">

                                    <span className="text-primary-orange font-bold">
                                        {key}: </span>
                                    {topDisplay[key]}
                                </h3>
                            )
                        })
                    }
                </div>

                <ReadingsTable />
                
            </div>
        </div>
    )
}