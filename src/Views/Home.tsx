import {Col, Container, Row} from "react-bootstrap";
import React, {MutableRefObject, useContext, useEffect, useRef, useState,} from "react";
import {ipcRenderer} from "electron";
import {ActionsDataContext, MinimalViewContext} from "@/App";
import HandVision from "@/AI/HandVision";
import EnableWebcam from "@/AI/EnableWebcam";
import FaceDetection from "@/AI/FaceVision";
import {GestureData} from "@/types/GestureData";
import {IndexFinger} from "@/types/IndexFinger";
import Webcam from "@/Elements/Webcam";
import DesktopCapturer from "@/Elements/DesktopCapturer";
import DesktopCapturerToolbar from "@/Elements/DesktopCapturerToolbar";
import {Thumb} from "@/types/Thumb";
import ExecuteActions from "@/AI/executeActions";
import TopToolbar from "../Elements/toolbars/TopToolbar";
import Maintoolbar from "../Elements/toolbars/Maintoolbar";
import MinimalView from "@/Views/MinimalView";
import TitleBar from "@/TopAppBar";
import Button from "react-bootstrap/Button";

const constraints = {
    video: true,
}

function Home() {
    const webCamRef: MutableRefObject<HTMLVideoElement | null> = useRef(null)
    const canvasRef: MutableRefObject<HTMLCanvasElement | null> = useRef(null)

    const desktopCapturer = DesktopCapturer()
    const desktopCapturerToolbar = DesktopCapturerToolbar(desktopCapturer.videoRef.current)

    const [trackMouse, setTrackMouse] = useState<boolean>(false)
    const [trackGesture, setTrackGesture] = useState<boolean>(false)
    const [trackFace, setTrackFace] = useState<boolean>(false)

    const {minimalView, setMinimalView} = useContext(MinimalViewContext)

    const {gestureData: actionData} = useContext(ActionsDataContext)
    const [gestureData, setGestureData] = useState<GestureData[]>()
    const [gestureAi, setGestureAi] = useState<any>()
    const [gazeAi, setGazeAi] = useState<any>()
    const [gazeState, setGazeState] = useState<boolean>(false)
    const [indexFinger, setIndexFinger] = useState<IndexFinger[] | undefined>()
    const [thumb, setThumb] = useState<Thumb[] | undefined>();
    const [hideElements, setHideElements] = useState(false)

    useEffect(() => {
        if (
            canvasRef !== null &&
            webCamRef.current != null &&
            canvasRef.current != null
        ) {
            setGestureAi(
                HandVision(
                    webCamRef.current,
                    canvasRef.current,
                    setGestureData,
                    setIndexFinger,
                    setThumb
                )
            );

            setGazeAi(
                FaceDetection(webCamRef.current, canvasRef.current, setGazeState)
            );
        }
    }, [canvasRef]);

    useEffect(() => {
        if (webCamRef.current) {
            EnableWebcam(webCamRef.current);
        }
        if (gestureAi) {
            gestureAi.createGestureRecognizer();
            if (webCamRef.current !== null) {
                const webcamCurrent = webCamRef.current;
                navigator.mediaDevices.getUserMedia(constraints).then(() => {
                    webcamCurrent.addEventListener("loadeddata", gestureAi.predictWebcam);
                });
            }
        }
        if (gazeAi) {
            gazeAi.createFaceMeshRecognizer();
            if (webCamRef.current !== null) {
                const webcamCurrent = webCamRef.current;
                navigator.mediaDevices.getUserMedia(constraints).then(() => {
                    webcamCurrent.addEventListener("loadeddata", gazeAi.predictWebcam);
                });
            }
        }
    }, [gestureAi, gazeAi]);

    useEffect(() => {
        if (gestureData && actionData && gazeState) {
            ExecuteActions(gestureData, actionData).then(() =>
                console.log("Actions executed")
            );
        }
    }, [gestureData, actionData]);

    useEffect(() => {
        if (
            indexFinger &&
            thumb &&
            gestureData &&
            gestureData?.[0]?.category === "one"
        ) {
            ipcRenderer.invoke("mouseClick");
        }
    }, [gestureData]);

    useEffect(() => {
        if (
            indexFinger &&
            thumb &&
            gestureData &&
            gestureData?.[0]?.category === "three2"
        ) {
            ipcRenderer.invoke("moveMouse", indexFinger[0], thumb[0]);
        }
        console.log(gestureData?.[0]?.category);
    }, [gestureData]);

    useEffect(() => {
        if (indexFinger && thumb && gestureData && gestureData[0]) {
            ipcRenderer.invoke(
                "dragMouse",
                indexFinger[0],
                thumb[0],
                gestureData[0].category
            );
        }
        console.log(gestureData?.[0]?.category);
    }, [gestureData]);

    return minimalView === "false" ? (
        <>
            <Container
                style={{
                    maxWidth: "100%",
                    height: "100vh",
                    maxHeight: "100vh",
                    padding: 0,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#171717",
                }}
            >
                <TitleBar/>
                <TopToolbar/>
                <Row style={{flex: "1", margin: 0, padding: 0, alignItems: "center"}}>
                    <Col style={{margin: 0, padding: 0}}>
                        <Webcam canvasRef={canvasRef} webCamRef={webCamRef}/>
                    </Col>
                    <Col style={{margin: 0, padding: 0, alignItems: "center"}}>
                        {desktopCapturer.element}
                    </Col>
                </Row>
                <Maintoolbar
                    desktopCapturerOptions={desktopCapturerToolbar}
                />
            </Container>
        </>
    ) : (
        <MinimalView/>
    )
}

export default Home
