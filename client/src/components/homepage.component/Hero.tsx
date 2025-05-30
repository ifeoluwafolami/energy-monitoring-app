import { Link } from "react-router-dom";
import { Button } from "../global/Button";

export default function Hero() {
    return (
        <>
            {/*   H   E   R   O   */}

            {/* Mobile Screens */}
            <div className="flex sm:hidden w-full items-center justify-center py-11 mt-3 md:py-0 md:pb-6 px-4 overflow-hidden">
                
                <div className="py-16 flex flex-col items-center justify-center text-center">
                    
                    <h1 className="font-bold text-[55px] text-center text-primary-blue font-audiowide"><span className="text-primary-orange">Energy </span>Monitoring</h1>

                    <div className="text-center text-md mt-2 mb-6 text-primary-blue flex flex-col">
                        <span>Energy Collation Intranet for </span>
                        <span>IBEDC Feeders</span>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-2 mb-12">

                        <Link to='/register'>
                        <Button
                        text="Get Started"
                        className="flex-grow h-15"
                        />
                        </Link>
                        
                        <Link to='/login'>
                        <Button
                        text="Login"
                        className="flex-grow h-15"
                        variant="outline"
                        />
                        </Link>
                        
                    </div>
                    

                </div>

            </div>  

            {/* Larger Screens */}
            <div className="hidden md:flex w-full h-screen items-center justify-center mt-[-5rem] px-6 lg:px-12 xl:px-16">
                <div className="max-w-5xl w-full flex flex-col items-center justify-center text-center">
                    
                    <div className="">
                        <h1 className="font-bold text-[100px] text-center text-primary-blue font-audiowide">
                            <span className="text-primary-orange">Energy </span>Monitoring
                        </h1>

                        <p className="text-center text-xl mb-4 text-primary-blue">
                            Energy Collation Intranet for IBEDC Feeders
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center w-[25%]">

                        <Link to='/login' className="w-full sm:w-auto">
                        <Button
                        text="Login"
                        variant="outline"
                        size="xlarge"
                        />
                        </Link>

                        <Link to='/register' className="w-full sm:w-auto">
                        <Button
                        text="Get Started"
                        size="xlarge"
                        />
                        </Link>

                    </div>

                </div>
            </div>
        </>
    )
}