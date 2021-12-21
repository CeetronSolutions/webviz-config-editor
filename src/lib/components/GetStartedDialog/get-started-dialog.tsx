import React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Typography from "@mui/material/Typography";
import MobileStepper from "@mui/material/MobileStepper";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import { useTheme } from "@mui/material/styles";

import { SettingsStore, ConfigStore } from "../Store";
import { Settings, SettingMeta } from "../../utils/settings";
import { PreferenceItem } from "../Preferences/components/preference-item";

export const GetStartedDialog: React.FC = () => {
    const settingsStore = SettingsStore.useStore();
    const configStore = ConfigStore.useStore();
    const [activeStep, setActiveStep] = React.useState(0);
    const theme = useTheme();

    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        const initialized = configStore.state.config.find((el) => el.id === "initialized")?.config;
        if (!initialized) {
            setOpen(true);
        }
    }, [configStore.state]);

    const handleClose = () => {
        setOpen(false);
    };

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const makeStep = (step: number): React.ReactNode => {
        var settings: SettingMeta[] = [];
        Object.keys(Settings).forEach((category) => {
            settings = settings.concat(Settings[category].filter((el) => el.needsInitialization));
        });
        if (step === 0) {
            return (
                <div style={{ textAlign: "center" }}>
                    <img src="/wce-icon.png" alt="" style={{ height: 100, marginBottom: 16 }} />
                    <Typography gutterBottom variant="h6">
                        Welcome to
                    </Typography>
                    <Typography gutterBottom variant="h4">
                        Webviz Config Editor
                    </Typography>
                    <Typography gutterBottom variant="body1">
                        Get quickly started by setting some preferences.
                    </Typography>
                </div>
            );
        } else {
            return <PreferenceItem key={settings[step].id} {...settings[step]} />;
        }
    };

    return (
        <div>
            <Dialog onClose={handleClose} aria-labelledby="customized-dialog-title" open={open}>
                <DialogTitle sx={{ m: 0, p: 2, border: 0 }}>
                    <IconButton
                        aria-label="close"
                        onClick={handleClose}
                        sx={{
                            position: "absolute",
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>{makeStep(activeStep)}</DialogContent>
                <DialogActions>
                    <MobileStepper
                        variant="progress"
                        steps={6}
                        position="static"
                        activeStep={activeStep}
                        sx={{ maxWidth: 400, flexGrow: 1 }}
                        nextButton={
                            <Button size="small" onClick={handleNext} disabled={activeStep === 5}>
                                Next
                                {theme.direction === "rtl" ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
                            </Button>
                        }
                        backButton={
                            <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
                                {theme.direction === "rtl" ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
                                Back
                            </Button>
                        }
                    />
                </DialogActions>
            </Dialog>
        </div>
    );
};
