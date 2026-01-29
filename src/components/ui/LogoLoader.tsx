import Image from "next/image";

interface LogoLoaderProps {
    className?: string;
    size?: "sm" | "md" | "lg";
}

export default function LogoLoader({ className = "", size = "md" }: LogoLoaderProps) {
    const sizeClasses = {
        sm: "w-12 h-12",
        md: "w-24 h-24",
        lg: "w-32 h-32",
    };

    return (
        <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
            <div className={`relative ${sizeClasses[size]} animate-pulse`}>
                <Image
                    src="/images/logo.png"
                    alt="Greenbird Logo"
                    fill
                    className="object-contain"
                    priority
                />
            </div>
            <div className="mt-4 flex space-x-1">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
            </div>
        </div>
    );
}
