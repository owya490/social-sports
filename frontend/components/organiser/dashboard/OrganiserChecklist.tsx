import OrganiserCheckbox from "@/components/organiser/dashboard/OrganiserCheckbox";
import { useEffect, useState } from "react";

interface ChecklistItem {
  id: number;
  label: string;
  link: string;
  checked: boolean;
}

const initialChecklist: ChecklistItem[] = [
  { id: 0, checked: false, label: "Add a picture", link: "/profile" },
  { id: 1, checked: false, label: "Add a description", link: "/profile" },
  { id: 2, checked: false, label: "Add a Stripe Account", link: "/event/create" },
  { id: 3, checked: false, label: "Create your first event", link: "/event/create" },
];

export default function OrganiserChecklist() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedChecklist = localStorage.getItem("checklist");
      if (savedChecklist) {
        setChecklist(JSON.parse(savedChecklist));
      }
      setIsMounted(true);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("checklist", JSON.stringify(checklist));
    }
  }, [checklist, isMounted]);

  const handleCheck = (idx: number) => {
    setChecklist(
      checklist.map((check) => {
        if (check.id === idx) {
          return { ...check, checked: !check.checked };
        }
        return check;
      })
    );
  };

  const resetChecklist = () => {
    setChecklist(
      checklist.map((check) => {
        return { ...check, checked: false };
      })
    );
  };

  const allItemsChecked = checklist.every((item) => item.checked);

  return (
    <div className="md:w-full lg:min-w-[600px]">
      <div className="bg-organiser-light-gray p-4 sm:p-8 rounded-2xl">
        {!allItemsChecked && (
          <>
            <h1 className="text-2xl font-bold">Finish setting up</h1>
            {checklist.map((checkbox) => (
              <OrganiserCheckbox
                key={checkbox.id}
                label={checkbox.label}
                link={checkbox.link}
                checked={checkbox.checked}
                onChange={() => handleCheck(checkbox.id)}
              />
            ))}
          </>
        )}
        {allItemsChecked && (
          <>
            <h1 className="text-center py-6 sm:py-16 font-bold text-xl sm:text-2xl">
              Good job you have finished setting up ✅ <br></br>
              Go out there and make more events
            </h1>
            <p className="text-[#BABABA] text-end hover:underline hover:cursor-pointer" onClick={resetChecklist}>
              Reset
            </p>
          </>
        )}
      </div>
    </div>
  );
}
