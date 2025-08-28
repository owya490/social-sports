import { StaticImageData } from "next/image";
import BadmintonImage from "./../public/images/sport-icons/reshot-icon-badminton-L2HG8MEXV6.svg";
import BaseballImage from "./../public/images/sport-icons/reshot-icon-baseball-bat-4VRP9QE3SA.svg";
import BasketballImage from "./../public/images/sport-icons/reshot-icon-basketball-YHLJCPQSNE.svg";
import CricketImage from "./../public/images/sport-icons/reshot-icon-cricket-bat-and-ball-6ZKUANYD2F.svg";
import SoccerImage from "./../public/images/sport-icons/reshot-icon-football-9BL6YR7JAD.svg";
import OztagImage from "./../public/images/sport-icons/reshot-icon-football-ii-YZ9N4X356K.svg";
import TennisImage from "./../public/images/sport-icons/reshot-icon-softball-LMUT5BZ9GJ.svg";
import TableTennisImage from "./../public/images/sport-icons/reshot-icon-table-tennis-HFEQCNR95U.svg";
import VolleyballImage from "./../public/images/sport-icons/reshot-icon-volley-ball-NHZFG6TPSC.svg";

export interface SportConfig {
  name: string;
  value: string;
  iconImage: StaticImageData;
  defaultThumbnailUrl: string;
}

export const SPORTS_CONFIG: Record<string, SportConfig> = {
  volleyball: {
    name: "Volleyball",
    value: "volleyball",
    iconImage: VolleyballImage,
    defaultThumbnailUrl:
      "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2FeventThumbnails%2Fvolleyball-default.jpg?alt=media&token=4bad4cf7-8d53-4bb5-a657-6d8ea871d6fd",
  },
  badminton: {
    name: "Badminton",
    value: "badminton",
    iconImage: BadmintonImage,
    defaultThumbnailUrl:
      "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2FeventThumbnails%2Fbadminton-default.jpg?alt=media&token=187db12a-6e04-44da-aedc-04c5a1db99f7",
  },
  cricket: {
    name: "Cricket",
    value: "cricket",
    iconImage: CricketImage,
    defaultThumbnailUrl:
      "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2FeventThumbnails%2Fcricket-default.jpg?alt=media&token=1c1ac45c-0bfe-4ab2-803a-daa0a524d733",
  },
  baseball: {
    name: "Baseball",
    value: "baseball",
    iconImage: BaseballImage,
    defaultThumbnailUrl:
      "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2FeventThumbnails%2Fbaseball-default.jpg?alt=media&token=c890c369-2793-44bb-b618-0b1e39cc64cc",
  },
  basketball: {
    name: "Basketball",
    value: "basketball",
    iconImage: BasketballImage,
    defaultThumbnailUrl:
      "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2FeventThumbnails%2Fbasketball-default.jpg?alt=media&token=3871475e-a25c-4fa0-bf3a-875241da48c4",
  },
  soccer: {
    name: "Soccer",
    value: "soccer",
    iconImage: SoccerImage,
    defaultThumbnailUrl:
      "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2FeventThumbnails%2Fsoccer-default.jpg?alt=media&token=131621c2-8e69-4c90-b3fa-1d4522bcc700",
  },
  tennis: {
    name: "Tennis",
    value: "tennis",
    iconImage: TennisImage,
    defaultThumbnailUrl:
      "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2FeventThumbnails%2Ftennis-default.jpg?alt=media&token=2dd4f5c1-30f0-4c9d-9dcf-72b40e7f14e1",
  },
  "table-tennis": {
    name: "Table Tennis",
    value: "table-tennis",
    iconImage: TableTennisImage,
    defaultThumbnailUrl:
      "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2FeventThumbnails%2Ftable-tennis-default.jpg?alt=media&token=2a07940e-b45e-4e19-b442-d1bbe8c69a35",
  },
  oztag: {
    name: "Oztag",
    value: "oztag",
    iconImage: OztagImage,
    defaultThumbnailUrl:
      "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2FeventThumbnails%2Foztag-default.jpg?alt=media&token=acc4d712-398b-424b-bae2-0cafff22d0a4",
  },
};
