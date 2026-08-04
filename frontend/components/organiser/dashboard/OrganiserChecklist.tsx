import OrganiserCheckbox from "@/components/organiser/dashboard/OrganiserCheckbox";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";

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
    checklist.forEach((item) => {
      if (item.checked === false) {
        return;
      }
    });
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
    <div className="bg-surface p-6 rounded-xl">
      {!isMounted ? (
        <>
          <h2 className="type-section">
            <Skeleton width={200} className="mb-1" />
          </h2>
          {initialChecklist.map((item) => (
            <div key={item.id} className="flex items-center mb-4">
              <Skeleton
                circle
                height={20}
                width={20}
                wrapper={({ children }) => {
                  return <div className="mx-3">{children}</div>;
                }}
              />
              <Skeleton width={150} height={20} />
            </div>
          ))}
        </>
      ) : (
        <>
          {!allItemsChecked && (
            <>
              <h2 className="type-section">Finish setting up</h2>
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
              <h2 className="type-section text-center py-6 sm:py-16">
                Good job you have finished setting up ✅ <br></br>
                Go out there and make more events
              </h2>
              <button
                type="button"
                className="text-foreground-muted text-end hover:underline hover:cursor-pointer bg-transparent border-0 p-0 w-full font-sans"
                onClick={resetChecklist}
              >
                Reset
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
