
interface AuthHeaderProps {
    title: string;
    description: string;
    centered?: boolean;
}

export function AuthHeader({ title, description, centered = false }: AuthHeaderProps) {
    return (
        <div className={`mb-8 ${centered ? "text-center" : ""}`}>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
    );
}
