type RoleType = "system" | "user" | "assistant";
  
interface Message {
    role: RoleType;
    content: string;
}

export class StatusDto{
    email:string;
    status:string;
    comments:string;
}
