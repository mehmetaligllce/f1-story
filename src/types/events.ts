export interface RaceEvent {
    id: string;
    question: string;
    lap: [number, number];
    position: [number, number];
    options: RaceOption[];
}

interface RaceOption {
    id: string;
    icon: string;
    label: string;
    description: string;
}
