#!/bin/bash
PID=$(lsof -ti:6600)
if [ -z "$PID" ]; then
  echo "No service running on port 6600"
  exit 0
fi
kill "$PID"
echo "Service stopped (PID: $PID)"
