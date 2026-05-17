#!/bin/bash
cd "$(dirname "$0")"
java -Dlog.name=air-notes -Dlog.level=info -Dlog.path=/opt/AirNotes/workspace/logs -jar platform/target/air-notes-platform.jar
