import React, { useState } from "react";
import { View, Linking } from "react-native";
import { useMonitor } from "../monitor";
import DeviceMap from "../components/DeviceMap";
import {
  Badge,
  Button,
  Card,
  CardHeading,
  DataRow,
  Disclosure,
  Icon,
  Page,
  Row,
  Txt,
} from "../components/ui";
import { C, fonts } from "../theme";
export default function Location() {
  const m = useMonitor(),
    gps = m.latest?.gps;
  const [center, setCenter] = useState(0),
    [error, setError] = useState("");
  const valid =
    !!gps?.valid &&
    gps.latitudeDeg !== undefined &&
    gps.longitudeDeg !== undefined;
  return (
    <Page title="Location">
      <Card>
        <CardHeading
          title="Monitor GPS"
          right={
            <Badge
              text={valid ? (m.fresh ? "GPS fix" : "Last fix") : "Searching"}
              tone={valid && m.fresh ? "green" : "amber"}
            />
          }
        />
        {valid ? (
          <DeviceMap
            key={m.config.tileUrl + center}
            lat={gps!.latitudeDeg!}
            lon={gps!.longitudeDeg!}
            tileUrl={m.config.tileUrl}
          />
        ) : (
          <View
            style={{
              height: 320,
              backgroundColor: C.bg,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              gap: 15,
              padding: 25,
            }}
          >
            <Icon name="locate-outline" size={40} color={C.green} />
            <Txt style={{ fontFamily: fonts.bold, fontSize: 16 }}>
              Waiting for GPS
            </Txt>
            <Txt style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>
              Move the antenna near a clear sky view.
            </Txt>
          </View>
        )}
        <Row
          style={{ justifyContent: "space-between", marginTop: 18, gap: 12 }}
        >
          <Button
            secondary
            label="Recenter"
            icon="locate-outline"
            disabled={!valid}
            onPress={() => setCenter((c) => c + 1)}
          />
          <Button
            label="Open map"
            icon="open-outline"
            disabled={!valid}
            onPress={() =>
              void Linking.openURL(
                "https://www.openstreetmap.org/?mlat=" +
                  gps!.latitudeDeg +
                  "&mlon=" +
                  gps!.longitudeDeg +
                  "#map=16/" +
                  gps!.latitudeDeg +
                  "/" +
                  gps!.longitudeDeg,
              ).catch(() => setError("Unable to open map"))
            }
          />
        </Row>
        {error ? (
          <Txt style={{ color: C.amber, fontSize: 12, marginTop: 10 }}>
            {error}
          </Txt>
        ) : null}
      </Card>
      <Card>
        <CardHeading title="Coordinates" subtitle="WGS84" />
        <DataRow
          label="Latitude"
          value={valid ? gps!.latitudeDeg!.toFixed(6) + "°" : "—"}
        />
        <DataRow
          label="Longitude"
          value={valid ? gps!.longitudeDeg!.toFixed(6) + "°" : "—"}
        />
        <Row style={{ justifyContent: "space-between", marginTop: 20 }}>
          <View>
            <Txt style={{ fontSize: 12, color: C.muted }}>SATELLITES</Txt>
            <Txt style={{ fontFamily: fonts.bold, fontSize: 23, marginTop: 6 }}>
              {gps?.satellites ?? "—"}
            </Txt>
          </View>
          <View>
            <Txt style={{ fontSize: 12, color: C.muted }}>ALTITUDE</Txt>
            <Txt style={{ fontFamily: fonts.bold, fontSize: 23, marginTop: 6 }}>
              {gps?.altitudeMeters?.toFixed(0) ?? "—"}{" "}
              <Txt style={{ fontSize: 12, color: C.muted }}>m</Txt>
            </Txt>
          </View>
          <View>
            <Txt style={{ fontSize: 12, color: C.muted }}>SPEED</Txt>
            <Txt style={{ fontFamily: fonts.bold, fontSize: 23, marginTop: 6 }}>
              {gps?.speedKmh?.toFixed(1) ?? "—"}{" "}
              <Txt style={{ fontSize: 12, color: C.muted }}>km/h</Txt>
            </Txt>
          </View>
        </Row>
      </Card>
      <Card>
        <Disclosure title="GPS details">
          <DataRow label="HDOP" value={gps?.hdop?.toFixed(2) ?? "—"} />
          <DataRow
            label="Fix age"
            value={gps ? (gps.ageMs / 1000).toFixed(1) + " s" : "—"}
          />
          <Txt style={{ color: C.muted, fontSize: 12 }}>
            Approximate GPS location.
          </Txt>
        </Disclosure>
      </Card>
    </Page>
  );
}
