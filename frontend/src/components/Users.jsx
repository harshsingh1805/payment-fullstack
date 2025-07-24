import { useEffect, useState } from "react"
import { Button } from "./Button"
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../config";
export const Users = () => {
    // Replace with backend call
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState("");
   const [debouncedFilter, setDebouncedFilter] = useState("");
     const currentUserId = localStorage.getItem("userId");
    // Debounce the filter input
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedFilter(filter);
        }, 500); 

        return () => clearTimeout(timeoutId); // Cleanup on every keystroke
    }, [filter]);


    useEffect(() => {
        if (!debouncedFilter.trim()) {
            setUsers([]);
            return;
        }

        const token = localStorage.getItem("token");

        axios.get(`${BACKEND_URL}/api/v1/user/bulk?filter=` + debouncedFilter, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then((response) => {
           const filteredUsers = response.data.user.filter(user => user._id.toString() !== currentUserId);
            setUsers(filteredUsers);
        }).catch((error) => {
            console.error(error);
        });
    }, [debouncedFilter]);

    return <>
        <div className="font-bold mt-6 text-lg">
            Users
        </div>
        <div className="my-2">
            <input type="text" onChange={(e)=>{
                setFilter(e.target.value);
            }} placeholder="Search users..." className="w-full px-2 py-1 border rounded border-slate-200"></input>
        </div>
        <div>
            {users.map(user => <User key={user._id} user={user} />)}
        </div>
    </>
}

function User({user}) {
    const navigate = useNavigate();
    return <div className="flex justify-between">
        <div className="flex">
            <div className="rounded-full h-12 w-12 bg-slate-200 flex justify-center mt-1 mr-2">
                <div className="flex flex-col justify-center h-full text-xl">
                    {user.firstName[0]}
                </div>
            </div>
            <div className="flex flex-col justify-center h-ful">
                <div>
                    {user.firstName} {user.lastName}
                </div>
            </div>
        </div>

        <div className="flex flex-col justify-center h-ful">
            <Button onClick={(e)=>{
                navigate("/send?id=" + user._id + "&name=" + user.firstName);

            }} label={"Send Money"} />
        </div>
    </div>
}