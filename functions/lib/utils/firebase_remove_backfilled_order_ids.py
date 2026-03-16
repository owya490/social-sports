import uuid

from firebase_admin import firestore
from firebase_functions import https_fn, options
from lib.constants import EVENT_METADATA, db
from lib.logging import Logger


def _is_truthy(value: str) -> bool:
    return str(value).lower() in ["1", "true", "yes", "y"]


HARDCODED_BACKFILLED_EVENT_ORDER_IDS = [
    ("0DIrAmwq0tXhK5gXZ0Au", "7CP3XRuJMfrsoczJJgtq"),
    ("0GH20NXXJHUhNmeaZf8v", "TALTzRDj2QTTvUP2BAZK"),
    ("1gURShT7hT91owd2pu15", "eAeCMyqqnljBfaYOR0YW"),
    ("1rUgMDxtF1SehNPbSJ3F", "grh4PglqM5XOujktKV3a"),
    ("2Ffe3p12RXBK6IUWsDfk", "w7nHlXZHKbvbwWlAWl4U"),
    ("2HyKEh9cQIi9juEhGFke", "ss9LmAmdVyFMjeahDEL2"),
    ("2ddpi9bt8wbkazyJpx74", "iiYvYvBxyVdjlxZJ5U2b"),
    ("52mqrPGTltuELK6A1TYP", "1DJ60OfK4RkoFg6oxlhb"),
    ("5wW3GqRGTC3H3Lo95ele", "M52PlfCFv4qDOBoo8N1Q"),
    ("6cg9Z0imW4V2hYyvoSWa", "bFsjZU5CLn7X4AzXTfCK"),
    ("7Je7zTSxdyma8uhcnTmZ", "rM9qvgKsbCwlUn1sV0T5"),
    ("81Ipz1B29d58rKv379h9", "g3eUMoEp5lfnfOfgYHwD"),
    ("82f6Bf5PV6Ao72oFzwXN", "fVtg5MKyhn97Nlaggaaz"),
    ("8Ht4A5PYUIb5qZMwDwlp", "Fsqa6Sy6lz9mutBeF4Jo"),
    ("8zTnGHZG8b9XGsZWgmv8", "wKMl9rJv1ihi3VePR6Rr"),
    ("9PLiKRZJTkrbCIl5GAoV", "ZuypbQ3wgnCMgDzCOpuA"),
    ("9t1cjSC6wAT2Ipwch9Dj", "o0Mo51hroIZOZlI9VSyK"),
    ("A3PrhbBWltxda39SbXMD", "yAJf2xojy0yq2q7U6l5n"),
    ("A7F23kKM2qnzyO0XDORq", "Vv3fMRVeytwQAMdcLN7I"),
    ("AOqvhhny3RwIlZLargAb", "hDg3cENwbwo8v0Zzrqrg"),
    ("AtHp1vkjd3U0IHLQaELK", "ymOdqz5oTtmwbXWSUvaL"),
    ("BVkGxIAFde8pEnXAek7r", "c6q1hcnayqc89itWtV2B"),
    ("BnwLtlFzvWc7uZG2S5rr", "5IlJ62sdVzyLv3MU1Vqj"),
    ("C89PuUX2f0iTw2GAmiG2", "L8fNMFsPTXQHNs7neDNG"),
    ("CHrrY4H3SJutIOiWMiTs", "gShAtxtwtemop44sozrT"),
    ("CuaY3z1qgtAArGamMXkF", "TYEdnOg0DNZPsUI6w55b"),
    ("DmhxVtgGzNYVYBv4GoOQ", "ltQxmYXpXU2H8Jwse3px"),
    ("EgfBw4p8TQq9ux4JaGHe", "wtN6RlfmVApJBrmVA1gl"),
    ("Ehi0hrB2QppBlA8gkXnE", "H8e54bWCPwVZrCYIWOQP"),
    ("FN4iluMpma3RGZdI30tK", "6eHvPyZ150urQXnxGsyh"),
    ("GHPO1lQdSYsgFiG04og5", "aDQQvgFtPzEFlrFLcx0W"),
    ("GeJY9CyPZUGv4uaYEHUA", "5AMv8G0MJVvn1NYBE1ri"),
    ("H1jKsaZ8hsfTqhUuAAM4", "czOUtGpXWFjQjRaMHJT5"),
    ("I4kHGq7DaRY7HyxaPhF0", "IDGOikossJIkDkhsvecJ"),
    ("IHkO2Mx3f8NLnwiAiU6x", "CgXEM3S9sKq7dZvrZeXC"),
    ("ImdddhlQJvSohYmJ0Wmj", "dYq9XrQK9PflMQi4NaIy"),
    ("JyN5ko0yRGPyDsmvttSs", "WtWPlzgSqXu29t4LORcq"),
    ("KNMoU4uoW2tb8oseNodF", "d4MygFiAN77A3XiqjeTt"),
    ("L4dX1PwDDtPR76uVwB7H", "2565Kil11FJdGN1UTBk1"),
    ("LWTW8Ms4zlyF63ZYGXhZ", "BrzHrNvHBOfnADbSjbta"),
    ("LrTo5il0Aa7LEMs9YaAG", "Pru0GvvGrxLN8JIOxhOu"),
    ("MUYcjNAOQWEVfGmSxR1k", "whPtEmhiezcMTIFQoC0p"),
    ("MndOwN9mVqaUySo9VBfe", "Z5zmo5pT8gby0ddEKT1g"),
    ("NEULHODNFRzjuBSkLQKL", "CwkOn3261ttwMzM5WNYL"),
    ("NfKZe5rwWzz4sEuvTqTB", "QeXebJedCN4IQ7Nko4dh"),
    ("NfxfiWe2JXvOpWYWC5Zj", "yVcoh8N2emMIztvkGyK2"),
    ("P5wq7M9H5m8bUpGJvZoY", "rAKc9jsWYIiqHCcUYeqs"),
    ("QPs1armwgnOZKCYmthRP", "F4SKs8mQPyKmcvrDOxEP"),
    ("QxBgrhXUNh4tYzfYoRF3", "ac86W3yQindKitqUF3Ab"),
    ("SnjjUmysUQ8aH2opAHEv", "7kIEFf4qJlht7OSVLw4D"),
    ("T2nfEfSqQuilB0eNLcGw", "kn7MlMrKEy3ddbDywTLj"),
    ("TaoX6HGXYLQrQDE5xaPn", "dRB1Mq0yZOHyOFxhHTTH"),
    ("UKDoycsXqQoBD3BwKjeG", "tYC87UxaEm6XY13ong2V"),
    ("VWrqlYtmDm859bS3EfQw", "rYvExtpjrAarOWmOFgUv"),
    ("WWNVQKR68C8GFcBleD8R", "euFWUafYWmrEXjLYwFfC"),
    ("XP4q4A8dPq0EoS208bCD", "yMmwmScBTvx18RRZiKmu"),
    ("Y21yGZ7CbunNdXE2St3T", "3CsMNXdtcSCqTjKRZ00b"),
    ("YGIfWArRCDB2kHVmPje4", "EfLWoU8aIraSqhhgcu8C"),
    ("Z8uThUpGa0r2e5HR14fc", "uzp2ZRVAwOGBnjhyXClN"),
    ("ZRmZzio58vNKFtRPqoXW", "5pZjTcGclW4BB6oJMji5"),
    ("a86cqjoCGPLQqMRylUpB", "1iZlhSq7hPIbvomvG8Me"),
    ("aePylN3FoOnM8yAjSJq2", "bsKIMSsNQw8Q6qd9CWr9"),
    ("bTj9suvIxp1MkXdZk7cO", "Pt0GLtjzv8lL2GTkSpoz"),
    ("dKnao4TWutkEJIwlJaax", "tsIoebs1fwYWOVNdcEm2"),
    ("dZ78f7cntk1229gQoyfR", "13MlYItOaFOzLoMH5kT2"),
    ("eEOnKpjuJ6oOyar1cWg4", "SqjvcucNWO3cz3HO135K"),
    ("fIO3C2YIgUCoymT0HZG2", "jOSZYXpFEQooPT3mdT6h"),
    ("fn5t4yS5xCe1MJD559LP", "5Pck3cZfxv1QMoty8i3b"),
    ("gxFXGiwt9zDceekMjg4v", "1vujdsYiJH92gHiRPSvc"),
    ("i8IkM0KvoVttv2jA3a9W", "nC8MJePcGbzSbSiddGYs"),
    ("iyL3yoov1QHIUinwnlmc", "YcqbrF5DMvsdGKelWn5O"),
    ("jzgL2exKxtX8N5xLunAs", "gzscHPos3VWOiNoFTubZ"),
    ("kKP9t23LKdjAJXeriyBy", "U97qiPNmawsocRhihFaI"),
    ("l4l5jORgFgAB465ozR3F", "7sBt8gnw7TFI8vay6q9b"),
    ("lbTecfrwwx0GeomcfyUX", "w4CI6YFM0cz6VjMW5144"),
    ("mFOR20KwZE3HtCkHdkzw", "vXZv12sr7bXKibNONNnK"),
    ("o4r16DgbnQPv6rYqpIbY", "qTAWN6dEiwvXm6OupmfJ"),
    ("o83etRYlVRDoUs8wf3ri", "aVYsBt5THRHmxPPfuiHk"),
    ("oDq4i9pHDKGg8BSdRjDy", "fsRyoRLlQVzVyxZn5qoB"),
    ("pEb280qxOKef2mqsu5rX", "UF3cTMfM0J4iChoZi93p"),
    ("pLcg0aHuzWzJoBJjTFuk", "0dvNM3VbZ582od78znTS"),
    ("pyzqqcEuljjfsDCMwCN8", "M8sd3KYS3e1i7CuO2C1f"),
    ("qKBC0RMItyko8PBHinro", "7unqiBQV62OdgILTEW3Q"),
    ("qT8oePCnJ92EF6FDRvHj", "a5ftKxBQeHMGNyue6aCx"),
    ("qwqV1H67rh1hr1zQr2LV", "N2YPYlz2AGPzyNW7ApU7"),
    ("tHa1iwYdcNeB29RrBBhL", "fy2JLhzPpylg9l0LFSCa"),
    ("tZJ2HV7W1tD2GdkDoo0R", "y9FtHYpC4WPpVcO7qI4j"),
    ("tvOwt6hJYvabdeR8gGfd", "GNUNn5wBqYlBKKoVKHNo"),
    ("us7sNAojhDf9JL137sFA", "Uyf7r8VDFueyeZkXbHpm"),
    ("v1A9UBTi3SQUgP2YKyW3", "cbGWGTN0wDPwBRq6tyns"),
    ("xq2H5r3xVGfL8yNAxbkn", "H90FQAQdQr2XWJbSDQ4e"),
    ("yE7WwhdFUX8ydhicHBtp", "R3qOPl2aCdw62o85SpBj"),
    ("z3B62Kjw6P38mQ7rFJpC", "mhcW54hurdSbCgKnXShH"),
]

HARDCODED_BACKFILLED_EVENTS = [
    {"eventId": event_id, "orderId": order_id}
    for event_id, order_id in HARDCODED_BACKFILLED_EVENT_ORDER_IDS
]


@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["https://www.sportshub.net.au", "*"],
        cors_methods=["get", "post"],
    ),
    region="australia-southeast1",
)
def remove_backfilled_order_ids(req: https_fn.Request) -> https_fn.Response:
    uid = str(uuid.uuid4())
    logger = Logger(f"firebase_remove_backfilled_order_ids_logger_{uid}")
    logger.add_tag("uuid", uid)

    # Safety gate: function can be pinged during deployment.
    start_param = req.args.get("start", "") if req.args else ""
    start = _is_truthy(start_param)
    if not start:
        summary = {
            "started": False,
            "reason": "Missing start flag. Pass ?start=true to execute.",
            "dryRun": True,
        }
        logger.info(f"Rollback skipped: {summary}")
        return https_fn.Response(str(summary), status=200)

    # Safe default: dry run unless explicitly disabled.
    dry_run_param = req.args.get("dryRun", "true") if req.args else "true"
    dry_run = _is_truthy(dry_run_param)

    backfilled_events = HARDCODED_BACKFILLED_EVENTS
    if not backfilled_events:
        summary = {
            "started": True,
            "dryRun": dry_run,
            "attemptedCount": 0,
            "removedCount": 0,
            "failedCount": 0,
            "reason": "No hardcoded backfilled events configured.",
            "removedEvents": [],
            "failedEvents": [],
        }
        logger.warning(f"Rollback no-op: {summary}")
        return https_fn.Response(str(summary), status=200)

    removed_events = []
    failed_events = []

    for entry in backfilled_events:
        event_id = entry.get("eventId")
        order_id = entry.get("orderId")
        if not event_id or not order_id:
            failed_events.append(
                {
                    "eventId": event_id,
                    "orderId": order_id,
                    "error": "Missing eventId or orderId",
                }
            )
            continue

        try:
            if dry_run:
                logger.info(
                    f"Dry run remove orderId from metadata. eventId={event_id} orderId={order_id}"
                )
            else:
                db.collection(EVENT_METADATA).document(event_id).update(
                    {"orderIds": firestore.ArrayRemove([order_id])}
                )
                logger.info(
                    f"Removed orderId from metadata. eventId={event_id} orderId={order_id}"
                )

            removed_events.append(
                {"eventId": event_id, "orderId": order_id, "dryRun": dry_run}
            )
        except Exception as e:
            logger.error(
                f"Failed to remove orderId from metadata. eventId={event_id} orderId={order_id} error={e}"
            )
            failed_events.append(
                {"eventId": event_id, "orderId": order_id, "error": str(e)}
            )

    summary = {
        "started": True,
        "dryRun": dry_run,
        "attemptedCount": len(backfilled_events),
        "removedCount": len(removed_events),
        "failedCount": len(failed_events),
        "removedEvents": removed_events,
        "failedEvents": failed_events,
    }
    logger.info(f"Rollback complete: {summary}")
    return https_fn.Response(str(summary), status=200)
